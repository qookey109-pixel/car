import {chromium,webkit} from '@playwright/test';

// Both engines run the same gameplay contracts. Chromium owns numeric LOW budgets.
export const testBrowser={
  launch(options={}){return process.env.BROWSER==='webkit'?webkit.launch({headless:options.headless??true}):chromium.launch(options)}
};
