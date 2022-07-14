module.exports = new Proxy(
  {},
  {
    get() {
      return "";
    },
  },
);
