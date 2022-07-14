export default new Proxy(
  {},
  {
    get() {
      return "";
    },
  },
);
