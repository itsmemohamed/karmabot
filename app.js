const db = require('./database');
const listen = require('./listen');
const send = require('./send');
const get = require('./get');
const find = require('./find');
const utils = require('./utils');

// Get all workspace members on app start
const members = [];
get.members(1000).then((response) => {
  members.push(...response.members);
});

listen.message((event) => {
  const { text, channel, user: userFrom, ts } = event;

  const users = find.users(text);
  const tacos = find.tacos(text);

  tacos.forEach(() => {
    users.forEach((userTo) => {
      if (userFrom === userTo) return;

      db.add.taco(channel, userFrom, userTo, () => {
        send.confirmation.reaction(channel, ts);
      });
    });
  });

  if (users.length >= 3 && tacos.length) send.response.everyone(channel);

  // Only consider request answered if tacos are given to users
  if (!users.length || !tacos.length) return false;

  return listen.answer;
});

// eslint-disable-next-line max-statements
listen.mention((event) => {
  const { text, channel } = event;

  let period = '';
  const post = (tacos) => {
    const users = utils.countTacosByUser(members, tacos);
    send.leaderboard(channel, users, period);
  };

  if (find.leaderboard(text)) {
    if (find.all(text)) {
      period = 'all time';
      db.get('tacos')
        .all()
        .do(post);
    } else if (find.year(text)) {
      period = 'last 365 day';
      db.get('tacos')
        .days(365)
        .do(post);
    } else if (find.week(text)) {
      period = 'last 7 day';
      db.get('tacos')
        .days(7)
        .do(post);
    } else {
      period = 'last 30 day';
      db.get('tacos')
        .days(30)
        .do(post);
    }
  }

  if (find.rain(text)) send.response.rain(channel);
  if (find.dance(text)) send.response.dance(channel);
  if (find.goodbot(text)) send.response.yey(channel);
  if (find.badbot(text)) send.response.sadpanda(channel);
  if (find.dice(text)) send.response.dice(channel);

  return listen.answer;
});
