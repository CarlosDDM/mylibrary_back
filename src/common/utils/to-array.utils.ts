export const toArray = ({ value }) =>
  value == null ? value : Array.isArray(value) ? value : [value];
