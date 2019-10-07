export const currency = value => {
  const valueAsString = String(parseFloat(value).toFixed(2));
  const [intValue, decimalValue] = valueAsString.split('.');
  const groups = [];
  let consumed = intValue;
  while (consumed.length > 3) {
    groups.unshift(consumed.substr(-3));
    consumed = consumed.slice(0, -3);
  }
  groups.unshift(consumed);
  return 'R$ ' + groups.join('.') + ',' + decimalValue;
};

export const area = value => {
  return String(value).replace('.', ',') + ' m²';
};
