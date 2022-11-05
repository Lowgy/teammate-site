import { prisma } from '../src/server/db/client';
import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.espn.com/nfl/schedule', {
    waitUntil: 'load',
    timeout: 0,
  });

  // Has problem with International games
  const trimEverythingBeforeAndAfterComma = (str: string) => {
    const commaIndex = str.indexOf(',');
    const secondCommaIndex = str.indexOf(',', commaIndex + 1);
    return str.substring(commaIndex + 2, secondCommaIndex);
  };

  // Grabs the week of games.
  // TODO: Fix Structure, add to DB
  const grabWeekOfGames = async () => {
    const rows = await page.$$(
      '.ScheduleTables .Table__TR.Table__TR--sm.Table__even'
    );
    const formattedGames = await Promise.all(
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
        let location = await row.$eval(
          'td:nth-of-type(6)',
          (el) => el.innerHTML
        );
        location = trimEverythingBeforeAndAfterComma(location);
        return {
          homeTeam,
          awayTeam,
          time,
          location,
        };
      })
    );
    console.log(formattedGames);
    return formattedGames;
  };

  // Grabs the current NFL week #
  const getCurrentWeek = async () => {
    let week = await page.$eval(
      '.custom--week.is-active span',
      (el) => el.innerHTML
    );
    const findNumberInString = (str: any) => {
      const regex = /\d+/g;
      const found = str.match(regex);
      return found[0];
    };
    week = findNumberInString(week);
    return week;
  };

  const getNextWeekNumber = () => {
    const currentWeek = weekNumber;
    const nextWeek = parseInt(currentWeek) + 1;
    return nextWeek;
  };

  let weekNumber: any = await getCurrentWeek();

  while (weekNumber < 19) {
    console.log(`Currently scraping Week #${weekNumber}`);
    await grabWeekOfGames();
    weekNumber = getNextWeekNumber();
    await page.goto(
      `https://www.espn.com/nfl/schedule/_/week/${weekNumber}/year/2022/seasontype/2`,
      {
        waitUntil: 'load',
        timeout: 0,
      }
    );
  }

  await browser.close();
})();
