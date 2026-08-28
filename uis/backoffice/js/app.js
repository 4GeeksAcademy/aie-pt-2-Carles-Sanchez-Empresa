"use strict";
(() => {
  // ../../src/utils/collections.ts
  function filterProductsByWarehouse(products, warehouse) {
    return products.filter((product) => product.warehouse === warehouse);
  }
  function filterProductsByCategory(products, category) {
    return products.filter((product) => product.category === category);
  }
  function filterLowStockProducts(products) {
    return products.filter((product) => product.stockQuantity <= product.minStockThreshold);
  }
  function sortProductsByStock(products, order) {
    const sortedProducts = [...products];
    sortedProducts.sort((a, b) => {
      if (order === "asc") {
        return a.stockQuantity - b.stockQuantity;
      } else {
        return b.stockQuantity - a.stockQuantity;
      }
    });
    return sortedProducts;
  }
  function sortCarriersByReliability(carriers, order) {
    const sortedCarriers = [...carriers];
    sortedCarriers.sort((a, b) => {
      if (order === "asc") {
        return a.onTimeRate - b.onTimeRate;
      } else {
        return b.onTimeRate - a.onTimeRate;
      }
    });
    return sortedCarriers;
  }

  // ../../src/utils/search.ts
  function findProductBySKU(products, sku) {
    for (const product of products) {
      if (product.sku === sku) {
        return product;
      }
    }
    return null;
  }
  function findShipmentById(shipments, id) {
    for (const shipment of shipments) {
      if (shipment.id === id) {
        return shipment;
      }
    }
    return null;
  }
  function binarySearchProductByWeight(sortedProducts, targetWeight) {
    let left = 0;
    let right = sortedProducts.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (sortedProducts[mid].weightKg === targetWeight) {
        return mid;
      } else if (sortedProducts[mid].weightKg < targetWeight) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return -1;
  }

  // ../../src/utils/transformations.ts
  function calculateShippingCost(shipment, product, carrier) {
    let cost = carrier.baseRateUSD;
    cost += product.weightKg * carrier.ratePerKgUSD * shipment.quantity;
    cost += shipment.destination.distanceKm * carrier.ratePerKmUSD;
    if (shipment.priority === "Express") cost *= 1.3;
    else if (shipment.priority === "Same-day") cost *= 1.6;
    return Number(cost.toFixed(2));
  }
  function scoreCarrierForShipment(carrier, shipment, product) {
    let score = 0;
    const totalWeight = product.weightKg * shipment.quantity;
    if (carrier.operatesIn.includes(shipment.destination.country)) {
      score += 20;
    }
    if (totalWeight <= carrier.maxWeightKg) {
      score += 20;
    }
    if (carrier.acceptsPriority.includes(shipment.priority)) {
      score += 15;
    }
    if (!product.isFragile || carrier.handlesFragile) {
      score += 15;
    }
    score += carrier.onTimeRate * 0.3;
    return Number(score.toFixed(2));
  }
  function selectBestCarrier(carriers, shipment, product) {
    let bestCarrier = null;
    for (const carrier of carriers) {
      const score = scoreCarrierForShipment(carrier, shipment, product);
      if (score < 50) continue;
      const cost = calculateShippingCost(shipment, product, carrier);
      if (!bestCarrier || cost < bestCarrier.cost) {
        bestCarrier = { carrier, score, cost };
      }
    }
    return bestCarrier;
  }
  function countProductsByCategory(products) {
    const counts = {
      "Fashion": 0,
      "Electronics": 0,
      "Cosmetics": 0,
      "Home": 0,
      "Other": 0
    };
    for (const product of products) {
      counts[product.category]++;
    }
    return counts;
  }
  function calculateTotalInventoryValue(products) {
    let totalValue = 0;
    for (const product of products) {
      totalValue += product.stockQuantity * product.unitCostUSD;
    }
    return Number(totalValue.toFixed(2));
  }
  function calculateAverageShipmentDistance(shipments) {
    if (shipments.length === 0) return 0;
    let totalDistance = 0;
    for (const shipment of shipments) {
      totalDistance += shipment.destination.distanceKm;
    }
    const average = totalDistance / shipments.length;
    return Number(average.toFixed(2));
  }
  function groupShipmentsByStatus(shipments) {
    const groups = {
      "Pending": [],
      "Assigned": [],
      "In transit": [],
      "Delivered": [],
      "Failed": []
    };
    for (const shipment of shipments) {
      groups[shipment.status].push(shipment);
    }
    return groups;
  }
  function findTopCarriers(shipments, topN) {
    const carrierCounts = {};
    for (const shipment of shipments) {
      if (shipment.carrier === null) continue;
      if (carrierCounts[shipment.carrier]) {
        carrierCounts[shipment.carrier]++;
      } else {
        carrierCounts[shipment.carrier] = 1;
      }
    }
    const sorted = [];
    for (const name in carrierCounts) {
      sorted.push({ carrier: name, count: carrierCounts[name] });
    }
    sorted.sort((a, b) => b.count - a.count);
    return sorted.slice(0, topN);
  }

  // ../../src/utils/validations.ts
  function validateProduct(product) {
    const errors = [];
    if (!product.sku || product.sku.trim() === "") {
      errors.push("El SKU del producto no puede estar vac\xEDo");
    }
    if (product.weightKg <= 0 || product.weightKg > 100) {
      errors.push("El peso del producto debe ser mayor a 0 y menor o igual a 100 kg");
    }
    if (product.dimensions.lengthCm <= 0 || product.dimensions.lengthCm > 200 || product.dimensions.widthCm <= 0 || product.dimensions.widthCm > 200 || product.dimensions.heightCm <= 0 || product.dimensions.heightCm > 200) {
      errors.push("Todas las dimensiones deben ser mayores a 0 y menores o iguales a 200 cm");
    }
    if (product.stockQuantity < 0) {
      errors.push("La cantidad en stock no puede ser negativa");
    }
    if (product.minStockThreshold < 0) {
      errors.push("El umbral m\xEDnimo de stock no puede ser negativo");
    }
    if (product.unitCostUSD <= 0) {
      errors.push("El costo unitario debe ser mayor a 0");
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
  function validateShipment(shipment) {
    const errors = [];
    if (shipment.quantity <= 0) {
      errors.push("La cantidad del env\xEDo debe ser mayor a 0");
    }
    if (shipment.declaredValueUSD <= 0) {
      errors.push("El valor declarado del env\xEDo debe ser mayor a 0");
    }
    if (shipment.destination.distanceKm < 0) {
      errors.push("La distancia del destino no puede ser negativa");
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
  function validateCarrier(carrier) {
    const errors = [];
    if (carrier.baseRateUSD < 0) {
      errors.push("La tarifa base no puede ser negativa");
    }
    if (carrier.ratePerKgUSD < 0) {
      errors.push("La tarifa por kg no puede ser negativa");
    }
    if (carrier.ratePerKmUSD < 0) {
      errors.push("La tarifa por km no puede ser negativa");
    }
    if (carrier.avgDeliveryDays <= 0) {
      errors.push("Los d\xEDas promedio de entrega deben ser mayores a 0");
    }
    if (carrier.onTimeRate < 0 || carrier.onTimeRate > 100) {
      errors.push("La tasa de entrega a tiempo debe estar entre 0 y 100");
    }
    if (carrier.maxWeightKg <= 0) {
      errors.push("El peso m\xE1ximo debe ser mayor a 0");
    }
    if (!carrier.operatesIn || carrier.operatesIn.length < 1) {
      errors.push("El transportista debe operar en al menos 1 pa\xEDs");
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ../../src/data/sampleData.ts
  var sampleProducts = [
    { sku: "SHOE-BLK-42", name: "Zapatillas Negras Running - Talla 42", category: "Fashion", weightKg: 0.8, dimensions: { lengthCm: 35, widthCm: 22, heightCm: 12 }, warehouse: "Los Angeles", stockQuantity: 45, minStockThreshold: 20, unitCostUSD: 35, isFragile: false, status: "Active" },
    { sku: "LAPTOP-DELL-15", name: "Laptop Dell 15 pulgadas", category: "Electronics", weightKg: 2.3, dimensions: { lengthCm: 40, widthCm: 28, heightCm: 3 }, warehouse: "Zaragoza", stockQuantity: 8, minStockThreshold: 10, unitCostUSD: 650, isFragile: true, status: "Low stock" },
    { sku: "PERFUME-COCO-50", name: "Perfume Coco 50ml", category: "Cosmetics", weightKg: 0.3, dimensions: { lengthCm: 12, widthCm: 8, heightCm: 15 }, warehouse: "Los Angeles", stockQuantity: 120, minStockThreshold: 30, unitCostUSD: 85, isFragile: true, status: "Active" }
  ];
  var sampleShipments = [
    { id: "SH-2024-8821", sku: "LAPTOP-DELL-15", quantity: 1, origin: "Zaragoza", destination: { city: "Madrid", country: "Spain", postalCode: "28001", distanceKm: 320 }, priority: "Express", declaredValueUSD: 650, carrier: null, status: "Pending", createdAt: /* @__PURE__ */ new Date("2024-03-15") }
  ];
  var sampleCarriers = [
    { id: "CAR-UPS", name: "UPS", operatesIn: ["United States"], baseRateUSD: 5, ratePerKgUSD: 1.2, ratePerKmUSD: 0.05, avgDeliveryDays: 3, onTimeRate: 88, maxWeightKg: 30, handlesFragile: true, acceptsPriority: ["Standard", "Express"] },
    { id: "CAR-SEUR", name: "SEUR", operatesIn: ["Spain"], baseRateUSD: 6.5, ratePerKgUSD: 1.5, ratePerKmUSD: 0.08, avgDeliveryDays: 2, onTimeRate: 92, maxWeightKg: 25, handlesFragile: true, acceptsPriority: ["Standard", "Express", "Same-day"] },
    { id: "CAR-DHL", name: "DHL Express", operatesIn: ["United States", "Spain"], baseRateUSD: 12, ratePerKgUSD: 2, ratePerKmUSD: 0.1, avgDeliveryDays: 1, onTimeRate: 95, maxWeightKg: 50, handlesFragile: true, acceptsPriority: ["Express", "Same-day"] }
  ];

  // ../../src/ui/handlers.ts
  var state = {
    products: [...sampleProducts],
    shipments: JSON.parse(JSON.stringify(sampleShipments)),
    carriers: [...sampleCarriers]
  };
  function show(id, data) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  }
  function fillTextarea(id, data) {
    const el = document.getElementById(id);
    if (el) el.value = JSON.stringify(data, null, 2);
  }
  function showSampleData() {
    fillTextarea("sampleProducts", state.products);
    fillTextarea("sampleShipments", state.shipments);
    fillTextarea("sampleCarriers", state.carriers);
  }
  function applyDataChanges() {
    try {
      const newProducts = JSON.parse(document.getElementById("sampleProducts").value);
      const newShipments = JSON.parse(document.getElementById("sampleShipments").value);
      const newCarriers = JSON.parse(document.getElementById("sampleCarriers").value);
      state.products.length = 0;
      state.shipments.length = 0;
      state.carriers.length = 0;
      state.products.push(...newProducts);
      state.shipments.push(...newShipments);
      state.carriers.push(...newCarriers);
      fillTextarea("sampleProducts", state.products);
      fillTextarea("sampleShipments", state.shipments);
      fillTextarea("sampleCarriers", state.carriers);
      const status = document.getElementById("dataStatus");
      if (status) {
        status.textContent = "\u2705 Datos actualizados correctamente";
        status.className = "text-xs text-emerald-600 font-medium";
      }
    } catch (e) {
      const status = document.getElementById("dataStatus");
      if (status) {
        status.textContent = "\u274C Error de JSON: " + (e instanceof Error ? e.message : String(e));
        status.className = "text-xs text-red-600 font-medium";
      }
    }
  }
  window.runFilterByWarehouse = () => {
    const wh = document.getElementById("warehouseSelect").value;
    const res = filterProductsByWarehouse(state.products, wh);
    show("resultWarehouse", res.length ? res : "\u274C Ning\xFAn producto encontrado");
  };
  window.runFilterByCategory = () => {
    const cat = document.getElementById("categorySelect").value;
    const res = filterProductsByCategory(state.products, cat);
    show("resultCategory", res.length ? res : "\u274C Ning\xFAn producto encontrado");
  };
  window.runLowStock = () => {
    const res = filterLowStockProducts(state.products);
    show("resultLowStock", res.length ? res : "\u2705 Ning\xFAn producto con stock bajo");
  };
  window.runSortByStock = () => {
    const order = document.getElementById("stockOrder").value;
    const res = sortProductsByStock(state.products, order);
    show("resultSortStock", res.length ? res : "\u274C Sin resultados");
  };
  window.runSortCarriers = () => {
    const order = document.getElementById("reliabilityOrder").value;
    const res = sortCarriersByReliability(state.carriers, order);
    show("resultSortCarriers", res.length ? res : "\u274C Sin resultados");
  };
  window.runFindBySKU = () => {
    const sku = document.getElementById("skuInput").value;
    const res = findProductBySKU(state.products, sku);
    show("resultSKU", res ?? "\u274C Producto no encontrado");
  };
  window.runFindShipmentById = () => {
    const id = document.getElementById("shipmentIdInput").value;
    const res = findShipmentById(state.shipments, id);
    show("resultShipmentId", res ?? "\u274C Env\xEDo no encontrado");
  };
  window.runBinarySearch = () => {
    const target = parseFloat(document.getElementById("weightInput").value);
    const sorted = [...state.products].sort((a, b) => a.weightKg - b.weightKg);
    const idx = binarySearchProductByWeight(sorted, target);
    show("resultBinary", idx !== -1 ? `\u2705 Peso ${target} kg encontrado en \xEDndice ${idx}: ${JSON.stringify(sorted[idx], null, 2)}` : `\u274C Peso ${target} kg no encontrado (\xEDndice -1)`);
  };
  window.runScoreCarrier = () => {
    const results = state.carriers.map((c) => ({
      carrier: c.name,
      score: scoreCarrierForShipment(c, state.shipments[0], state.products[1])
    }));
    show("resultScore", results);
  };
  window.runSelectBest = () => {
    const res = selectBestCarrier(state.carriers, state.shipments[0], state.products[1]);
    show("resultBest", res ?? "\u274C Ning\xFAn transportista adecuado");
  };
  window.runCountByCategory = () => {
    show("resultCountCategory", countProductsByCategory(state.products));
  };
  window.runInventoryValue = () => {
    const value = calculateTotalInventoryValue(state.products);
    show("resultInventory", `\u{1F4B0} $${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`);
  };
  window.runAvgDistance = () => {
    show("resultAvgDist", `\u{1F4CF} ${calculateAverageShipmentDistance(state.shipments)} km`);
  };
  window.runGroupByStatus = () => {
    show("resultGroupStatus", groupShipmentsByStatus(state.shipments));
  };
  window.runTopCarriers = () => {
    const n = parseInt(document.getElementById("topNInput").value) || 3;
    show("resultTopCarriers", getTopCarriers(state.shipments, n));
  };
  window.runValidateProduct = () => {
    show("resultValidProduct", validateProduct(state.products[0]));
  };
  window.runValidateShipment = () => {
    show("resultValidShipment", validateShipment(state.shipments[0]));
  };
  window.runValidateCarrier = () => {
    show("resultValidCarrier", validateCarrier(state.carriers[0]));
  };
  window.applyDataChanges = applyDataChanges;
  function getTopCarriers(shipments, topN) {
    const result = findTopCarriers(shipments, topN);
    if (result.length === 0) {
      return "\u274C Ning\xFAn env\xEDo tiene un transportista asignado. Asigna un carrier a los env\xEDos para ver el ranking.";
    }
    return result;
  }
  showSampleData();
})();
