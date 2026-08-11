window.NR_TRAFFIC = (() => {
  const COLORS = [
    "#d9eef4", "#ffd23c", "#ff7a3d", "#9b87ff", "#65ff9c",
    "#ff78b4", "#5ad8ff", "#f6f1a4", "#ff595e", "#a8dadc"
  ];
  const TYPES = [
    "slow", "fast", "normal", "aggressive", "slow",
    "normal", "fast", "normal", "aggressive", "slow"
  ];
  const LANES = [-0.58, 0, 0.58];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function nearestLane(x) {
    return LANES.reduce(
      (best, lane) => Math.abs(lane - x) < Math.abs(best - x) ? lane : best,
      LANES[0]
    );
  }

  function createFleet() {
    const speedPattern = [6900, 8050, 7350, 7700, 6750, 7480, 8150, 7200, 7820, 6650];

    return Array.from({ length: 10 }, (_, index) => {
      const lane = LANES[index % LANES.length];
      return {
        id: index + 1,
        z: 1400 + index * 1650,
        x: lane,
        targetX: lane,
        homeLane: lane,
        speed: speedPattern[index],
        baseSpeed: speedPattern[index],
        color: COLORS[index],
        name: `AI-${index + 1}`,
        type: TYPES[index],
        laneTimer: 1.2 + (index % 4) * 0.7,
        laneCommitTimer: 0,
        laneCooldown: 0,
        overtaking: false,
        returnTimer: 0,
        braking: false,
        activeWeight: index < 6 ? 1 : 0,
        targetActive: index < 6,
        passCooldown: 0,
        lastRelative: 0
      };
    });
  }

  function desiredCount(density, lowQuality = false) {
    let count = density < 0.8 ? 3 : density > 1.2 ? 10 : 6;
    if (lowQuality) count = Math.min(count, 7);
    return count;
  }

  function placeOutsideView(car, index, playerZ, trackLength) {
    const lane = LANES[index % LANES.length];
    car.z = (playerZ + 4200 + index * 1150) % trackLength;
    car.x = lane;
    car.targetX = lane;
    car.homeLane = lane;
    car.laneCommitTimer = 0;
    car.laneCooldown = 1.4 + index * 0.08;
    car.overtaking = false;
    car.returnTimer = 0;
    car.passCooldown = 0.7;
  }

  function syncDensity(fleet, density, lowQuality, playerZ, trackLength, immediate = false) {
    const desired = desiredCount(density, lowQuality);

    fleet.forEach((car, index) => {
      const shouldBeActive = index < desired;
      if (shouldBeActive && !car.targetActive && car.activeWeight < 0.08) {
        placeOutsideView(car, index, playerZ, trackLength);
      }
      car.targetActive = shouldBeActive;
      if (immediate) car.activeWeight = shouldBeActive ? 1 : 0;
    });

    return desired;
  }

  function updateActivation(fleet, dt) {
    for (const car of fleet) {
      const rate = car.targetActive ? 1.15 : 0.72;
      const target = car.targetActive ? 1 : 0;
      if (car.activeWeight < target) car.activeWeight = Math.min(target, car.activeWeight + dt * rate);
      if (car.activeWeight > target) car.activeWeight = Math.max(target, car.activeWeight - dt * rate);
    }
  }

  function visibleFleet(fleet) {
    return fleet.filter(car => car.activeWeight > 0.025);
  }

  function planningFleet(fleet) {
    return fleet.filter(car => car.targetActive || car.activeWeight > 0.18);
  }

  function collidableFleet(fleet) {
    return fleet.filter(car => car.targetActive && car.activeWeight > 0.82);
  }

  function shortestSignedDistance(fromZ, toZ, trackLength) {
    let delta = toZ - fromZ;
    if (delta > trackLength / 2) delta -= trackLength;
    if (delta < -trackLength / 2) delta += trackLength;
    return delta;
  }

  function laneIsSafe(car, lane, cars, player, trackLength) {
    for (const other of cars) {
      if (other === car || other.activeWeight < 0.16) continue;
      const distance = shortestSignedDistance(car.z, other.z, trackLength);
      if (Math.abs(other.x - lane) < 0.30 && distance > -470 && distance < 780) return false;
    }

    const playerDistance = shortestSignedDistance(car.z, player.z, trackLength);
    if (Math.abs(player.x - lane) < 0.30 && playerDistance > -410 && playerDistance < 610) return false;
    return true;
  }

  function chooseSafeLane(car, preferred, cars, player, trackLength) {
    const alternatives = LANES
      .filter(lane => lane !== preferred)
      .sort((a, b) => Math.abs(lane - car.x) - Math.abs(best - car.x));

    return [preferred, ...alternatives].find(
      lane => laneIsSafe(car, lane, cars, player, trackLength)
    ) ?? car.targetX;
  }

  function requestLaneChange(car, preferred, context) {
    const {
      cars,
      player,
      trackLength,
      curveSeverity = 0,
      commitment = 0.95,
      cooldown = 2.2,
      reason = "normal"
    } = context;

    if (car.laneCommitTimer > 0 || car.laneCooldown > 0) return false;
    if (curveSeverity > 0.72) return false;

    const safeLane = chooseSafeLane(car, preferred, cars, player, trackLength);
    if (Math.abs(safeLane - car.x) < 0.10 || safeLane === car.targetX) return false;

    car.targetX = safeLane;
    car.laneCommitTimer = commitment;
    car.laneCooldown = cooldown;
    car.laneTimer = cooldown + 0.8 + Math.random() * 1.8;

    if (reason === "overtake") {
      car.homeLane = nearestLane(car.x);
      car.overtaking = true;
      car.returnTimer = 1.6;
    }
    return true;
  }

  function updateLaneState(car, dt) {
    car.laneCommitTimer = Math.max(0, car.laneCommitTimer - dt);
    car.laneCooldown = Math.max(0, car.laneCooldown - dt);
    car.laneTimer = Math.max(0, car.laneTimer - dt);
    car.returnTimer = Math.max(0, car.returnTimer - dt);
    car.passCooldown = Math.max(0, car.passCooldown - dt);

    if (Math.abs(car.x - car.targetX) < 0.035) {
      car.x = car.targetX;
      car.laneCommitTimer = 0;
    }
  }

  function leadVehicle(car, cars, player, trackLength) {
    let best = null;

    for (const other of cars) {
      if (other === car || other.activeWeight < 0.18) continue;
      const distance = shortestSignedDistance(car.z, other.z, trackLength);
      if (distance > 0 && distance < 1100 && Math.abs(other.x - car.x) < 0.27) {
        if (!best || distance < best.distance) best = { entity: other, distance, kind: "traffic" };
      }
    }

    const playerDistance = shortestSignedDistance(car.z, player.z, trackLength);
    if (playerDistance > 0 && playerDistance < 1100 && Math.abs(player.x - car.x) < 0.27) {
      if (!best || playerDistance < best.distance) {
        best = { entity: player, distance: playerDistance, kind: "player" };
      }
    }

    return best;
  }

  function classifyCollision(player, car, trackLength, maxSpeed, swept = null) {
    const longitudinal = swept?.longitudinal ??
      shortestSignedDistance(player.z, car.z, trackLength);
    const lateral = swept?.lateral ?? (car.x - player.x);
    const relativeSpeed = Math.abs(player.speed - car.speed);
    const impact = clamp((relativeSpeed + 900) / maxSpeed, 0.18, 1);

    let type = "rear-end";
    let label = "追尾碰撞";

    if (Math.abs(lateral) > 0.12) {
      type = lateral < 0 ? "side-left" : "side-right";
      label = lateral < 0 ? "左側擦撞" : "右側擦撞";
    } else if (longitudinal < 0) {
      type = "rear-hit";
      label = "後方撞擊";
    }

    return {
      type,
      label,
      impact,
      longitudinal,
      lateral,
      pushDirection: lateral === 0 ? (player.x >= car.x ? 1 : -1) : -Math.sign(lateral)
    };
  }

  function resetFleet(fleet, trackLength, density = 1, lowQuality = false, playerZ = 0) {
    const spacing = Math.max(1450, trackLength / (fleet.length + 6));

    fleet.forEach((car, index) => {
      const lane = LANES[index % LANES.length];
      car.z = (1450 + index * spacing) % trackLength;
      car.x = lane;
      car.targetX = lane;
      car.homeLane = lane;
      car.speed = car.baseSpeed;
      car.laneTimer = 1 + Math.random() * 3;
      car.laneCommitTimer = 0;
      car.laneCooldown = 0.8 + Math.random() * 0.7;
      car.overtaking = false;
      car.returnTimer = 0;
      car.braking = false;
      car.passCooldown = 0.5;
      car.lastRelative = shortestSignedDistance(playerZ, car.z, trackLength);
    });

    syncDensity(fleet, density, lowQuality, playerZ, trackLength, true);
  }

  return {
    lanes: LANES.slice(),
    createFleet,
    desiredCount,
    syncDensity,
    updateActivation,
    visibleFleet,
    planningFleet,
    collidableFleet,
    chooseSafeLane,
    requestLaneChange,
    updateLaneState,
    leadVehicle,
    classifyCollision,
    shortestSignedDistance,
    resetFleet
  };
})();