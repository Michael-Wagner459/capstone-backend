// config/roles.js
const roleCategoryMap = {
  admin: ['general', 'dm', 'player', 'mod'],
  mod: ['general', 'dm', 'player'],
  dm: ['general', 'dm'],
  player: ['general', 'player'],
};

module.exports = roleCategoryMap;
