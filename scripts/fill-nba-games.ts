import { prisma } from '../src/server/db/client';
import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.espn.com/nba/schedule', {
    waitUntil: 'load',
    timeout: 0,
  });
  const trimDay = (str: string) => {
    const commaIndex = str.indexOf(',');
    return str.substring(commaIndex + 2);
  };

  // Last day of Season is 20230409
  // Grab games
  // TODO: Click through days and grab more games, Fix Structure, add to DB
  const grabGames = async () => {
    const dayTable = await page.$$('.ResponsiveTable');
    const formattedGames = await Promise.all(
      dayTable.map(async (day) => {
        const date = await day.$eval('.Table__Title', (el) => el.innerHTML);
        const rows = await day.$$('.Table__TR.Table__TR--sm.Table__even');
        const games = await Promise.all(
          rows.map(async (row) => {
            const homeTeam = await row.$eval(
              'td:nth-of-type(2) .Table__Team a:nth-of-type(2)',
              (el) => el.innerHTML
            );
            const awayTeam = await row.$eval(
              'td:nth-of-type(1) div span a:nth-of-type(2)',
              (el) => el.innerHTML
            );
            const time = await row.$eval(
              'td:nth-of-type(3) a',
              (el) => el.innerHTML
            );
            const location = await row.$eval(
              'td:nth-of-type(2) .Table__Team a:nth-of-type(2)',
              (el) => el.innerHTML
            );
            return {
              homeTeam,
              awayTeam,
              time,
              date: trimDay(date),
              location,
            };
          })
        );
        return games;
      })
    );
    console.log(formattedGames);
  };

  await grabGames();
  await browser.close();
})();
