import { prisma } from '../src/server/db/client';
import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.espn.com/nhl/schedule', {
    waitUntil: 'load',
    timeout: 0,
  });

  const trimDay = (str: string) => {
    const commaIndex = str.indexOf(',');
    return str.substring(commaIndex + 2);
  };

  // Last day of Season is 20230413
  // Grab games
  // TODO: Fix Structure, add to DB
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
            prisma.game.create({
              data: {
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                time: time,
                date: trimDay(date),
                location: location,
              },
            });
          })
        );
        return games;
      })
    );
    console.log(formattedGames);
  };

  const getActiveDate = async () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr'];
    let day = await page.$eval(
      '.is-active .Day__Number span',
      (el) => el.innerHTML
    );
    console.log(day);
    if (months.some((month) => day.includes(month))) {
      day += ' 2023';
    } else {
      day += ' 2022';
    }
    day = new Date(day).toLocaleDateString();
    const formattedDate = parseInt(day.replaceAll('-', ''));
    console.log(formattedDate, 'FORMATTED DATE');
    return formattedDate;
  };

  const getCurrentDayIndex = async () => {
    const week = await page.$('.Week.currentWeek .Week__wrapper');
    const days: any = await week?.$$('.Day');
    let activeDay = await Promise.all(
      days?.map(async (day: any, index: number) => {
        let test = await day.$eval(
          '.Day__Number span',
          (el: any) => el.innerHTML
        );
        if (test === 'Jan 1') {
          test += ' 2023';
        } else {
          test += ' 2022';
        }
        test = new Date(test).toLocaleDateString();
        const formattedDate = parseInt(test.replaceAll('-', ''));
        if (formattedDate === date) {
          return index;
        }
      })
    );
    activeDay = activeDay.filter((day: any) => day !== undefined);
    return activeDay[0] + 1;
  };

  let date: any = await getActiveDate();
  const dateIndex: any = await getCurrentDayIndex();

  while (date < 20230414) {
    await grabGames();
    await page.click('.Arrow--right');
    await page.screenshot({ path: 'example.png' });

    await page.click(
      `.Week.currentWeek .Week__wrapper .Day:nth-of-type(${dateIndex})`
    );
    await page.screenshot({ path: 'screenshot.png' });
    date = await getActiveDate();
  }

  await browser.close();
})();
