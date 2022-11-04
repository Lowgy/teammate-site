import { prisma } from '../src/server/db/client';
import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.espn.com/nba/teams', {
    waitUntil: 'load',
    timeout: 0,
  });

  const grabTeamInfo = async () => {
    const rows = await page.$$('.TeamLinks');
    let index = 94;
    const formattedTeam = await Promise.all(
      rows.map(async (row) => {
        const name = await row.$eval('h2', (el) => el.innerHTML);
        const logo = await row.$eval('img', (el) => el.src);
        index = index + 1;
        const id = index;
        return {
          name,
          logo,
          id,
        };
      })
    );
    return formattedTeam;
  };
  const fillTeams = async () => {
    const teams = await grabTeamInfo();
    await prisma.team.createMany({
      data: teams,
    });
  };
  await fillTeams();
  await browser.close();
})();
