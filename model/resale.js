(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CustoVeiculoResale = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  function referenceResalePrice(vehicle, horizonMonths) {
    if (!vehicle || !Number.isFinite(vehicle.price) || vehicle.price<0 ||
        !Number.isInteger(horizonMonths) || horizonMonths<1)
      throw new RangeError('Veículo ou horizonte inválido');
    if (vehicle.residualMethod === 'fixed') {
      if (!Number.isFinite(vehicle.residualPrice) || vehicle.residualPrice<0)
        throw new RangeError('Valor residual inválido');
      return vehicle.residualPrice;
    }
    if (vehicle.residualMethod === 'annual-rate') {
      const rate=vehicle.annualDepreciationRate;
      if (!Number.isFinite(rate) || rate<0 || rate>1) throw new RangeError('Depreciação inválida');
      return vehicle.price * Math.pow(1-rate,horizonMonths/12);
    }
    throw new RangeError('Método de valor residual desconhecido');
  }

  function saleProceeds(vehicle, resale, horizonMonths, channel) {
    if (!['private','dealer'].includes(channel)) throw new RangeError('Canal de venda desconhecido');
    const referencePrice=referenceResalePrice(vehicle,horizonMonths);
    const discount = channel==='private' ? resale.privateDiscountPct : resale.dealerDiscountPct;
    const fixedCosts = channel==='private' ? resale.privateFixedCosts : resale.dealerFixedCosts;
    if (!Number.isFinite(discount) || discount<0 || discount>1 ||
        !Number.isFinite(fixedCosts) || fixedCosts<0)
      throw new RangeError('Custo ou desconto da venda inválido');
    const grossSale = referencePrice*(1-discount);
    return { channel, referencePrice, discount, grossSale, fixedCosts,
      netProceeds: grossSale-fixedCosts, economicDepreciation: vehicle.price-referencePrice };
  }

  return { referenceResalePrice, saleProceeds };
});
