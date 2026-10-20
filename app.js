/* ============================================================================
   MASTERIZE × APPLE KEYNOTE — WEB PRESENTATION PRO v3.0 CONTROLLER
   Motor Reactivo de Cuentas ARTEPISA + Estudio de Orador 4 Tarjetas [P]
   ============================================================================ */
(function () {
  "use strict";

  var DEFAULTS = {
    contractGross: 150000,
    omarReimb: 10660,
    mon30: 3199,
    mon15: 973.5,
    viaticos: 1167.5,
    igualaGross: 10000,
    azure: 2000,
    claude: 2000,
    googleAi: 2000
  };

  var state = Object.assign({}, DEFAULTS);

  var SHORT_TITLES = [
    "El Contrato ARTEPISA",
    "Las 3 Bolsas del Contrato",
    "Los 3 Cobros (Hitos 1, 2 y 3)",
    "Caja Hito 1 ($30,000)",
    "Pago Individual por Socio",
    "Tabla Bancaria SPEI",
    "Iguala Mensual ($10,000/mes)",
    "Resumen en 4 Pasos"
  ];

  /* ---------- Formateadores Numéricos ---------- */
  function fmtCurrency(n, decimals) {
    var num = Number.isFinite(n) ? n : 0;
    var sign = num < -0.004 ? "-" : "";
    var abs = Math.abs(num);
    var hasCents = Math.abs(abs - Math.round(abs)) > 0.004;
    var d = typeof decimals === "number" ? decimals : (hasCents ? 2 : 0);
    return sign + "$" + abs.toLocaleString("en-US", {
      minimumFractionDigits: d,
      maximumFractionDigits: d
    });
  }

  function fmtSignedCurrency(n, decimals) {
    var num = Number.isFinite(n) ? n : 0;
    var prefix = num > 0.004 ? "+" : (num < -0.004 ? "-" : "");
    var abs = Math.abs(num);
    var hasCents = Math.abs(abs - Math.round(abs)) > 0.004;
    var d = typeof decimals === "number" ? decimals : (hasCents ? 2 : 0);
    return prefix + "$" + abs.toLocaleString("en-US", {
      minimumFractionDigits: d,
      maximumFractionDigits: d
    });
  }

  function fmtCompactK(n) {
    var num = Math.max(0, Number(n) || 0);
    if (num >= 1000 && Math.abs(num % 1000) < 0.01) {
      return "$" + (num / 1000).toFixed(0) + "k";
    }
    if (num >= 1000) {
      return "$" + (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return fmtCurrency(num);
  }

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  /* ---------- Motor de Cálculo Financiero ARTEPISA ---------- */
  function computeFinancials() {
    var gross = Math.max(0, Number(state.contractGross) || 0);
    var withIva = gross * 1.16;

    // 3 Bolsas Maestras: 70% Pool Socios / 20% Caja MASTERIZE / 10% Closer Omar
    var poolTotal = gross * 0.70;
    var cajaTotal = gross * 0.20;
    var closerTotal = gross * 0.10;

    // 3 Hitos de Cobro: 40% H1 / 30% H2 / 30% H3
    var h1Gross = gross * 0.40;
    var h2Gross = gross * 0.30;
    var h3Gross = gross * 0.30;

    // Regla Hito 1: Primeros $30k (20% contrato) llenan el 100% de Caja MASTERIZE;
    // la otra mitad del Hito 1 va a Socios (10% Closer sobre H1 + resto a Pool).
    var h1Caja = cajaTotal;
    var h1SociosTotal = Math.max(0, h1Gross - h1Caja);
    var h1Closer = h1Gross * 0.10;
    var h1Pool = Math.max(0, h1SociosTotal - h1Closer);

    // Hitos 2 y 3: $0 a Caja, 100% a Socios
    var h2Closer = h2Gross * 0.10;
    var h2Pool = h2Gross - h2Closer;
    var h3Closer = h3Gross * 0.10;
    var h3Pool = h3Gross - h3Closer;

    // Participación por Socio dentro del Pool (50% Daniel, 25% Omar, 15% Pedro, 10% Octavio)
    var danH1 = h1Pool * 0.50;
    var danH2 = h2Pool * 0.50;
    var danH3 = h3Pool * 0.50;
    var danPool = poolTotal * 0.50;

    var omarPoolH1 = h1Pool * 0.25;
    var omarPoolH2 = h2Pool * 0.25;
    var omarPoolH3 = h3Pool * 0.25;
    var omarPool = poolTotal * 0.25;

    var omarUtilH1 = omarPoolH1 + h1Closer;
    var omarUtilH2 = omarPoolH2 + h2Closer;
    var omarUtilH3 = omarPoolH3 + h3Closer;
    var omarUtilTotal = omarPool + closerTotal;

    var pedH1 = h1Pool * 0.15;
    var pedH2 = h2Pool * 0.15;
    var pedH3 = h3Pool * 0.15;
    var pedPool = poolTotal * 0.15;

    var octH1 = h1Pool * 0.10;
    var octH2 = h2Pool * 0.10;
    var octH3 = h3Pool * 0.10;
    var octPool = poolTotal * 0.10;

    // Gastos de Arranque pagados con la Caja del Hito 1
    var omarReimb = Math.max(0, Number(state.omarReimb) || 0);
    var mon30 = Math.max(0, Number(state.mon30) || 0);
    var mon15 = Math.max(0, Number(state.mon15) || 0);
    var monTotal = mon30 + mon15;
    var viaticos = Math.max(0, Number(state.viaticos) || 0);

    var startupExpenses = omarReimb + monTotal + viaticos;
    var cajaFreeH1 = cajaTotal - startupExpenses;
    var cajaFreePct = cajaTotal > 0 ? (cajaFreeH1 / cajaTotal) * 100 : 0;

    // Totales con Reembolsos / Equipo en Hito 1
    var danGrand = danPool + monTotal;
    var omarGrand = omarUtilTotal + omarReimb;
    var pedGrand = pedPool + viaticos;
    var octGrand = octPool;

    // Efectivo real transferido en Hito 1
    var omarCashH1 = omarUtilH1 + omarReimb;
    var pedCashH1 = pedH1 + viaticos;

    // Iguala Mensual Post-Hito 3
    var igualaGross = Math.max(0, Number(state.igualaGross) || 0);
    var stackMonthly = state.azure + state.claude + state.googleAi;
    var igualaFreeMonthly = igualaGross - stackMonthly;
    var igualaFreeAnnual = igualaFreeMonthly * 12;
    var year1FreeTotal = cajaFreeH1 + igualaFreeAnnual;

    return {
      gross: gross,
      withIva: withIva,
      poolTotal: poolTotal,
      cajaTotal: cajaTotal,
      closerTotal: closerTotal,
      h1Gross: h1Gross,
      h2Gross: h2Gross,
      h3Gross: h3Gross,
      h1Caja: h1Caja,
      h1SociosTotal: h1SociosTotal,
      h1Closer: h1Closer,
      h2Closer: h2Closer,
      h3Closer: h3Closer,
      danH1: danH1,
      danH2: danH2,
      danH3: danH3,
      danPool: danPool,
      omarPoolH1: omarPoolH1,
      omarPoolH2: omarPoolH2,
      omarPoolH3: omarPoolH3,
      omarPool: omarPool,
      omarUtilH1: omarUtilH1,
      omarUtilH2: omarUtilH2,
      omarUtilH3: omarUtilH3,
      omarUtilTotal: omarUtilTotal,
      pedH1: pedH1,
      pedH2: pedH2,
      pedH3: pedH3,
      pedPool: pedPool,
      octH1: octH1,
      octH2: octH2,
      octH3: octH3,
      octPool: octPool,
      omarReimb: omarReimb,
      mon30: mon30,
      mon15: mon15,
      monTotal: monTotal,
      viaticos: viaticos,
      startupExpenses: startupExpenses,
      cajaFreeH1: cajaFreeH1,
      cajaFreePct: cajaFreePct,
      danGrand: danGrand,
      omarGrand: omarGrand,
      pedGrand: pedGrand,
      octGrand: octGrand,
      omarCashH1: omarCashH1,
      pedCashH1: pedCashH1,
      igualaGross: igualaGross,
      stackMonthly: stackMonthly,
      igualaFreeMonthly: igualaFreeMonthly,
      igualaFreeAnnual: igualaFreeAnnual,
      year1FreeTotal: year1FreeTotal
    };
  }

  /* ---------- Renderizado Reactivo de las 8 Láminas ---------- */
  function renderAll() {
    var m = computeFinancials();

    // Actualizar Pastillas Superiores y Títulos Cortos dinámicos
    setText("pillCajaLabel", "Caja " + fmtCompactK(m.cajaTotal));
    setText("pillIgualaLabel", "Iguala " + fmtCompactK(m.igualaGross));
    SHORT_TITLES[3] = "Caja Hito 1 (" + fmtCurrency(m.cajaTotal) + ")";
    SHORT_TITLES[6] = "Iguala Mensual (" + fmtCurrency(m.igualaGross) + "/mes)";

    // SLIDE 01: Portada
    setText("coverWithIva", fmtCurrency(m.withIva) + " MXN");
    var coverTotalEl = document.getElementById("coverContractTotal");
    if (coverTotalEl) {
      var numFormatted = fmtCurrency(m.gross).replace(/^\$/, "");
      coverTotalEl.innerHTML =
        '<span class="mz-currency-sign">$</span><span id="coverContractNum">' +
        numFormatted +
        "</span> <small>MXN</small>";
    }
    setText(
      "coverHitosInline",
      fmtCurrency(m.h1Gross) + " · " + fmtCurrency(m.h2Gross) + " · " + fmtCurrency(m.h3Gross)
    );
    setText("coverPoolVal", fmtCurrency(m.poolTotal));
    setText("coverDanVal", fmtCurrency(m.danPool));
    setText("coverOmarPoolVal", fmtCurrency(m.omarPool));
    setText("coverPedVal", fmtCurrency(m.pedPool));
    setText("coverOctVal", fmtCurrency(m.octPool));
    setText("coverCajaVal", fmtCurrency(m.cajaTotal));
    setText("coverExpensesVal", fmtCurrency(m.startupExpenses));
    setText("coverCajaFreeVal", fmtCurrency(m.cajaFreeH1) + " libres");
    setText("coverCloserVal", fmtCurrency(m.closerTotal));
    setText("coverCloserH1", fmtCurrency(m.h1Closer));
    setText("coverCloserH2", fmtCurrency(m.h2Closer));
    setText("coverCloserH3", fmtCurrency(m.h3Closer));

    // SLIDE 02: Las 3 Bolsas
    setText("s2TitleGross", fmtCurrency(m.gross));
    setText("s2BarPool", fmtCurrency(m.poolTotal));
    setText("s2BarCaja", fmtCurrency(m.cajaTotal));
    setText("s2BarCloser", fmtCurrency(m.closerTotal));
    setText("s2RowPool", fmtCurrency(m.poolTotal));
    setText("s2Dan", fmtCurrency(m.danPool));
    setText("s2Omar", fmtCurrency(m.omarPool));
    setText("s2Ped", fmtCurrency(m.pedPool));
    setText("s2Oct", fmtCurrency(m.octPool));
    setText("s2RowCaja", fmtCurrency(m.cajaTotal));
    setText("s2Exp", fmtCurrency(m.startupExpenses));
    setText("s2Free", fmtCurrency(m.cajaFreeH1) + " libres");
    setText("s2RowCloser", fmtCurrency(m.closerTotal));
    setText("s2CloserH1", fmtCurrency(m.h1Closer));
    setText("s2CloserH2", fmtCurrency(m.h2Closer));
    setText("s2CloserH3", fmtCurrency(m.h3Closer));

    // SLIDE 03: Los 3 Hitos
    setText("s3LeadCaja", fmtCurrency(m.cajaTotal));
    setText("s3H1Gross", fmtCurrency(m.h1Gross));
    setText("s3H1Caja", fmtCurrency(m.h1Caja));
    setText(
      "s3H1CajaSub",
      "Paga " + fmtCurrency(m.startupExpenses) + " gastos + deja " + fmtCurrency(m.cajaFreeH1) + " libres"
    );
    setText("s3H1Socios", fmtCurrency(m.h1SociosTotal));
    setText("s3H1ListCaja", fmtCurrency(m.h1Caja));
    setText("s3H1ListCloser", fmtCurrency(m.h1Closer));
    setText("s3H1ListDan", fmtCurrency(m.danH1));
    setText("s3H1ListOmar", fmtCurrency(m.omarPoolH1));
    setText("s3H1ListPed", fmtCurrency(m.pedH1));
    setText("s3H1ListOct", fmtCurrency(m.octH1));

    setText("s3H2Gross", fmtCurrency(m.h2Gross));
    setText("s3H2Socios", fmtCurrency(m.h2Gross));
    setText("s3H2ListCloser", fmtCurrency(m.h2Closer));
    setText("s3H2ListDan", fmtCurrency(m.danH2));
    setText("s3H2ListOmar", fmtCurrency(m.omarPoolH2));
    setText("s3H2ListPed", fmtCurrency(m.pedH2));
    setText("s3H2ListOct", fmtCurrency(m.octH2));

    setText("s3H3Gross", fmtCurrency(m.h3Gross));
    setText("s3H3Socios", fmtCurrency(m.h3Gross));
    setText("s3H3ListCloser", fmtCurrency(m.h3Closer));
    setText("s3H3ListDan", fmtCurrency(m.danH3));
    setText("s3H3ListOmar", fmtCurrency(m.omarPoolH3));
    setText("s3H3ListPed", fmtCurrency(m.pedH3));
    setText("s3H3ListOct", fmtCurrency(m.octH3));

    // SLIDE 04: Caja Hito 1 ($30,000)
    setText("s4KickerCaja", fmtCurrency(m.cajaTotal));
    setText("s4TitleCaja", fmtCurrency(m.cajaTotal));
    setText("s4EqCaja", fmtCurrency(m.cajaTotal, 2));
    setText("s4EqGastos", fmtCurrency(m.startupExpenses, 2));
    setText("s4EqLibre", fmtCurrency(m.cajaFreeH1, 2));
    setText("s4SubGastos", "-" + fmtCurrency(m.startupExpenses, 2) + " MXN");
    setText("s4OmarReimb", fmtCurrency(m.omarReimb, 2));
    setText("s4Mon30", fmtCurrency(m.mon30, 2));
    setText("s4Mon15", fmtCurrency(m.mon15, 2));
    setText("s4MonTotal", fmtCurrency(m.monTotal, 2));
    setText("s4PedViat", fmtCurrency(m.viaticos, 2));
    setText("s4RecGross", "+" + fmtCurrency(m.cajaTotal, 2));
    setText("s4RecOmar", "-" + fmtCurrency(m.omarReimb, 2));
    setText("s4RecMon", "-" + fmtCurrency(m.monTotal, 2));
    setText("s4RecViat", "-" + fmtCurrency(m.viaticos, 2));
    setText("s4RecFree", fmtCurrency(m.cajaFreeH1, 2));
    setText("s4RecPct", m.cajaFreePct.toFixed(1) + "%");

    // SLIDE 05: Por Socio
    setText("s5PoolTotal", fmtCurrency(m.poolTotal));
    setText("s5CloserTotal", fmtCurrency(m.closerTotal));

    setText("s5DanPool", fmtCurrency(m.danPool));
    setText("s5DanH1", fmtCurrency(m.danH1));
    setText("s5DanH2", fmtCurrency(m.danH2));
    setText("s5DanH3", fmtCurrency(m.danH3));
    setText("s5DanMon", "+" + fmtCurrency(m.monTotal, 2));
    setText("s5DanGrand", fmtCurrency(m.danGrand, 2));

    setText("s5OmarUtil", fmtCurrency(m.omarUtilTotal));
    setText("s5OmarPoolOnly", fmtCurrency(m.omarPool));
    setText("s5OmarCloserOnly", fmtCurrency(m.closerTotal));
    setText("s5OmarH1Break", fmtCurrency(m.omarPoolH1) + " Pool + " + fmtCurrency(m.h1Closer) + " Closer");
    setText("s5OmarH2Break", fmtCurrency(m.omarPoolH2) + " + " + fmtCurrency(m.h2Closer));
    setText("s5OmarH3Break", fmtCurrency(m.omarPoolH3) + " + " + fmtCurrency(m.h3Closer));
    setText("s5OmarH1", fmtCurrency(m.omarUtilH1));
    setText("s5OmarH2", fmtCurrency(m.omarUtilH2));
    setText("s5OmarH3", fmtCurrency(m.omarUtilH3));
    setText("s5OmarReimb", "+" + fmtCurrency(m.omarReimb, 2));
    setText("s5OmarGrand", fmtCurrency(m.omarGrand, 2));

    setText("s5PedPool", fmtCurrency(m.pedPool));
    setText("s5PedH1", fmtCurrency(m.pedH1));
    setText("s5PedH2", fmtCurrency(m.pedH2));
    setText("s5PedH3", fmtCurrency(m.pedH3));
    setText("s5PedViat", "+" + fmtCurrency(m.viaticos, 2));
    setText("s5PedGrand", fmtCurrency(m.pedGrand, 2));

    setText("s5OctPool", fmtCurrency(m.octPool));
    setText("s5OctH1", fmtCurrency(m.octH1));
    setText("s5OctH2", fmtCurrency(m.octH2));
    setText("s5OctH3", fmtCurrency(m.octH3));
    setText("s5OctGrand", fmtCurrency(m.octGrand, 2));

    // SLIDE 06: Tabla SPEI
    setText("thSpeiH1", "Hito 1 (" + fmtCurrency(m.h1Gross) + ")");
    setText("thSpeiH2", "Hito 2 (" + fmtCurrency(m.h2Gross) + ")");
    setText("thSpeiH3", "Hito 3 (" + fmtCurrency(m.h3Gross) + ")");

    var tbody = document.getElementById("speiTableBody");
    if (tbody) {
      tbody.innerHTML = [
        '<tr>' +
          '<td><strong>Inversión y Caja MASTERIZE</strong> <small class="mz-td-note">(' + fmtCurrency(m.startupExpenses) + ' gastos + ' + fmtCurrency(m.cajaFreeH1) + ' libres)</small></td>' +
          '<td><span class="mz-rule-pill is-emerald">20% (100% en H1)</span></td>' +
          '<td class="num"><strong>' + fmtCurrency(m.h1Caja, 2) + '</strong></td>' +
          '<td class="num text-muted">$0.00</td>' +
          '<td class="num text-muted">$0.00</td>' +
          '<td class="num"><strong class="text-emerald">' + fmtCurrency(m.cajaTotal, 2) + '</strong></td>' +
        '</tr>',
        '<tr>' +
          '<td><strong>Omar Moranza · Comisión Closer</strong></td>' +
          '<td><span class="mz-rule-pill is-amber">10% por Hito</span></td>' +
          '<td class="num">' + fmtCurrency(m.h1Closer, 2) + '</td>' +
          '<td class="num">' + fmtCurrency(m.h2Closer, 2) + '</td>' +
          '<td class="num">' + fmtCurrency(m.h3Closer, 2) + '</td>' +
          '<td class="num"><strong class="text-amber">' + fmtCurrency(m.closerTotal, 2) + '</strong></td>' +
        '</tr>',
        '<tr>' +
          '<td><strong>Daniel · Socio Líder Técnico</strong></td>' +
          '<td><span class="mz-rule-pill">50% del Pool (35% Contrato)</span></td>' +
          '<td class="num">' + fmtCurrency(m.danH1, 2) + '</td>' +
          '<td class="num">' + fmtCurrency(m.danH2, 2) + '</td>' +
          '<td class="num">' + fmtCurrency(m.danH3, 2) + '</td>' +
          '<td class="num"><strong>' + fmtCurrency(m.danPool, 2) + '</strong></td>' +
        '</tr>',
        '<tr>' +
          '<td><strong>Omar Moranza · Socio</strong></td>' +
          '<td><span class="mz-rule-pill">25% del Pool (17.5% Contrato)</span></td>' +
          '<td class="num">' + fmtCurrency(m.omarPoolH1, 2) + '</td>' +
          '<td class="num">' + fmtCurrency(m.omarPoolH2, 2) + '</td>' +
          '<td class="num">' + fmtCurrency(m.omarPoolH3, 2) + '</td>' +
          '<td class="num"><strong>' + fmtCurrency(m.omarPool, 2) + '</strong></td>' +
        '</tr>',
        '<tr>' +
          '<td><strong>Pedro · Socio Legal y Planta</strong></td>' +
          '<td><span class="mz-rule-pill">15% del Pool (10.5% Contrato)</span></td>' +
          '<td class="num">' + fmtCurrency(m.pedH1, 2) + '</td>' +
          '<td class="num">' + fmtCurrency(m.pedH2, 2) + '</td>' +
          '<td class="num">' + fmtCurrency(m.pedH3, 2) + '</td>' +
          '<td class="num"><strong>' + fmtCurrency(m.pedPool, 2) + '</strong></td>' +
        '</tr>',
        '<tr>' +
          '<td><strong>Octavio · Socio Implementación</strong></td>' +
          '<td><span class="mz-rule-pill">10% del Pool (7% Contrato)</span></td>' +
          '<td class="num">' + fmtCurrency(m.octH1, 2) + '</td>' +
          '<td class="num">' + fmtCurrency(m.octH2, 2) + '</td>' +
          '<td class="num">' + fmtCurrency(m.octH3, 2) + '</td>' +
          '<td class="num"><strong>' + fmtCurrency(m.octPool, 2) + '</strong></td>' +
        '</tr>'
      ].join("");
    }

    var tfoot = document.getElementById("speiTableFoot");
    if (tfoot) {
      tfoot.innerHTML =
        '<tr>' +
          '<td><strong>TOTAL DISPERSADO (SIN IVA)</strong></td>' +
          '<td><strong>100.0% Cuadrado</strong></td>' +
          '<td class="num"><strong>' + fmtCurrency(m.h1Gross, 2) + '</strong></td>' +
          '<td class="num"><strong>' + fmtCurrency(m.h2Gross, 2) + '</strong></td>' +
          '<td class="num"><strong>' + fmtCurrency(m.h3Gross, 2) + '</strong></td>' +
          '<td class="num"><strong class="text-accent">' + fmtCurrency(m.gross, 2) + '</strong></td>' +
        '</tr>';
    }

    var callout = document.getElementById("speiH1CashCallout");
    if (callout) {
      callout.innerHTML =
        '<strong>Nota de Transferencias Reales en el Hito 1 (' + fmtCurrency(m.h1Gross) + '):</strong> ' +
        'Sumando su Pool + Closer + Reembolso/Viáticos de los primeros ' + fmtCurrency(m.h1Caja) + ', en el Hito 1 se transfiere: ' +
        '<strong>Omar ' + fmtCurrency(m.omarCashH1, 2) + '</strong> (' + fmtCurrency(m.omarPoolH1) + ' Pool + ' + fmtCurrency(m.h1Closer) + ' Closer + ' + fmtCurrency(m.omarReimb) + ' Reembolso IA) · ' +
        '<strong>Daniel ' + fmtCurrency(m.danH1, 2) + '</strong> (+ ' + fmtCurrency(m.monTotal, 2) + ' compra de 2 monitores) · ' +
        '<strong>Pedro ' + fmtCurrency(m.pedCashH1, 2) + '</strong> (' + fmtCurrency(m.pedH1) + ' Pool + ' + fmtCurrency(m.viaticos, 2) + ' Viáticos) · ' +
        '<strong>Octavio ' + fmtCurrency(m.octH1, 2) + '</strong> · ' +
        '<strong>Caja Libre MASTERIZE ' + fmtCurrency(m.cajaFreeH1, 2) + '</strong>.';
    }

    // SLIDE 07: Iguala Mensual y Caja Año 1
    setText("s7TitleIguala", fmtCurrency(m.igualaGross));
    setText("s7TitleStack", fmtCurrency(m.stackMonthly));
    setText("s7TitleFree", fmtCurrency(m.igualaFreeMonthly));
    setText("s7EqH1Free", fmtCurrency(m.cajaFreeH1, 2));
    setText("s7EqMoFree", fmtCurrency(m.igualaFreeMonthly));
    setText("s7EqYrFree", fmtCurrency(m.igualaFreeAnnual, 2));
    setText("s7EqTotalYear1", fmtCurrency(m.year1FreeTotal, 2));
    setText("s7SubIguala", fmtCurrency(m.igualaGross, 2));
    setText("s7AnnualInline", fmtSignedCurrency(m.igualaFreeAnnual, 2) + " al año");
    setText("s7MoFree", fmtSignedCurrency(m.igualaFreeMonthly, 2) + "/mes");
    setText("s7RecIguala", "+" + fmtCurrency(m.igualaGross, 2) + "/mes");
    setText("s7RecStack", "-" + fmtCurrency(m.stackMonthly, 2) + "/mes");
    setText("s7RecMoFree", fmtSignedCurrency(m.igualaFreeMonthly, 2) + "/mes");
    setText("s7RecYrFree", fmtSignedCurrency(m.igualaFreeAnnual, 2) + "/año");
    setText("s7RecH1Free", fmtSignedCurrency(m.cajaFreeH1, 2));
    setText("s7RecTotalYear1", fmtCurrency(m.year1FreeTotal, 2));

    // SLIDE 08: Resumen en 4 Pasos + Simulador
    setText("s8Step1Caja", fmtCurrency(m.h1Caja));
    setText("s8Step1Free", fmtSignedCurrency(m.cajaFreeH1) + " libres");
    setText("s8Step1Omar", fmtCurrency(m.omarReimb));
    setText("s8Step1Mon", fmtCurrency(m.monTotal, 2));
    setText("s8Step1Viat", fmtCurrency(m.viaticos, 2));

    setText("s8Step2Socios", fmtCurrency(m.h1SociosTotal));
    setText("s8Step2Dan", fmtCurrency(m.danH1));
    setText("s8Step2Omar", fmtCurrency(m.omarUtilH1));
    setText("s8Step2OmarBreak", fmtCurrency(m.omarPoolH1) + " Pool + " + fmtCurrency(m.h1Closer) + " Closer");
    setText("s8Step2Ped", fmtCurrency(m.pedH1));
    setText("s8Step2Oct", fmtCurrency(m.octH1));

    setText("s8Step3Each", fmtCurrency(m.h2Gross));
    setText("s8Step3Total", fmtCurrency(m.h2Gross + m.h3Gross) + " Socios");
    setText("s8Step3Dan", fmtCurrency(m.danH2));
    setText("s8Step3Omar", fmtCurrency(m.omarUtilH2));
    setText("s8Step3OmarBreak", fmtCurrency(m.omarPoolH2) + " Pool + " + fmtCurrency(m.h2Closer) + " Closer");
    setText("s8Step3Ped", fmtCurrency(m.pedH2));
    setText("s8Step3Oct", fmtCurrency(m.octH2));

    setText("s8Step4Iguala", fmtCurrency(m.igualaGross));
    setText("s8Step4Year1", fmtCurrency(m.year1FreeTotal) + " Año 1");
    setText("s8Step4Stack", fmtCurrency(m.stackMonthly) + "/mes");
    setText("s8Step4Free", fmtSignedCurrency(m.igualaFreeMonthly) + "/mes libres");
    setText("s8Step4Annual", fmtSignedCurrency(m.igualaFreeAnnual) + "/año");

    setText("simCajaFree", fmtCurrency(m.cajaFreeH1, 2));
    setText("simYear1Free", fmtCurrency(m.year1FreeTotal, 2));

    updatePresentationHUD();
  }

  /* ---------- Exportar CSV Bancario SPEI Completo ---------- */
  function exportSpeiCsv() {
    var m = computeFinancials();
    var rows = [
      ["Concepto / Beneficiario", "Regla Pactada", "Hito 1 (40%)", "Hito 2 (30%)", "Hito 3 (30%)", "Total Liquidado"],
      ["Inversion y Caja MASTERIZE", "20% Contrato (100% en H1)", m.h1Caja.toFixed(2), "0.00", "0.00", m.cajaTotal.toFixed(2)],
      ["Omar Moranza - Comision Closer", "10% por Hito", m.h1Closer.toFixed(2), m.h2Closer.toFixed(2), m.h3Closer.toFixed(2), m.closerTotal.toFixed(2)],
      ["Daniel - 50% Pool Socios", "35.0% Contrato", m.danH1.toFixed(2), m.danH2.toFixed(2), m.danH3.toFixed(2), m.danPool.toFixed(2)],
      ["Omar Moranza - 25% Pool Socios", "17.5% Contrato", m.omarPoolH1.toFixed(2), m.omarPoolH2.toFixed(2), m.omarPoolH3.toFixed(2), m.omarPool.toFixed(2)],
      ["Pedro - 15% Pool Socios", "10.5% Contrato", m.pedH1.toFixed(2), m.pedH2.toFixed(2), m.pedH3.toFixed(2), m.pedPool.toFixed(2)],
      ["Octavio - 10% Pool Socios", "7.0% Contrato", m.octH1.toFixed(2), m.octH2.toFixed(2), m.octH3.toFixed(2), m.octPool.toFixed(2)],
      ["TOTAL DISPERSADO SIN IVA", "100.0%", m.h1Gross.toFixed(2), m.h2Gross.toFixed(2), m.h3Gross.toFixed(2), m.gross.toFixed(2)],
      [],
      ["DESGLOSE DE CAJA HITO 1 ($30,000.00)", "Detalle", "Monto Hito 1", "", "", ""],
      ["Reembolso IA Omar Moranza", "3 meses IA ($10,000) + Plan ($660)", m.omarReimb.toFixed(2), "", "", ""],
      ["Monitor Curvo 30\" Daniel (MLM52822704)", "Equipo de trabajo Mercado Libre", m.mon30.toFixed(2), "", "", ""],
      ["Monitor Portatil 15.6\" Daniel (MLM-2215895794)", "Equipo de trabajo Mercado Libre", m.mon15.toFixed(2), "", "", ""],
      ["Viaticos Operativos Planta Pedro", "Traslados y visitas ARTEPISA", m.viaticos.toFixed(2), "", "", ""],
      ["Reserva Libre en Caja MASTERIZE", "Remanente neto en tesoreria H1", m.cajaFreeH1.toFixed(2), "", "", ""],
      [],
      ["TRANSFERENCIAS REALES EN EFECTIVO HITO 1", "Composicion", "SPEI Hito 1", "SPEI Hito 2", "SPEI Hito 3", "Total Proyecto"],
      ["Omar Moranza (Pool + Closer + Reembolso IA)", "25% Pool + 10% Closer + Reembolso", m.omarCashH1.toFixed(2), m.omarUtilH2.toFixed(2), m.omarUtilH3.toFixed(2), m.omarGrand.toFixed(2)],
      ["Daniel (Efectivo Pool Socios)", "50% Pool Socios", m.danH1.toFixed(2), m.danH2.toFixed(2), m.danH3.toFixed(2), m.danPool.toFixed(2)],
      ["Compra 2 Monitores Daniel (Mercado Libre)", "MLM52822704 + MLM-2215895794", m.monTotal.toFixed(2), "0.00", "0.00", m.monTotal.toFixed(2)],
      ["Pedro (Pool + Viaticos Planta)", "15% Pool + Viaticos H1", m.pedCashH1.toFixed(2), m.pedH2.toFixed(2), m.pedH3.toFixed(2), m.pedGrand.toFixed(2)],
      ["Octavio (Efectivo Pool Socios)", "10% Pool Socios", m.octH1.toFixed(2), m.octH2.toFixed(2), m.octH3.toFixed(2), m.octGrand.toFixed(2)],
      ["Caja Libre MASTERIZE (Retencion Tesoreria)", "Reserva libre H1", m.cajaFreeH1.toFixed(2), "0.00", "0.00", m.cajaFreeH1.toFixed(2)]
    ];

    var csvContent = "\uFEFF" + rows.map(function (r) {
      return r.map(function (cell) {
        return '"' + String(cell).replace(/"/g, '""') + '"';
      }).join(",");
    }).join("\n");

    var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "MASTERIZE_ARTEPISA_SPEI_Hitos.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---------- Navegación Unificada (Reveal.js + Fallback Autónomo) ---------- */
  var fallbackIdx = 0;

  function isRevealReady() {
    return typeof Reveal !== "undefined" && typeof Reveal.isReady === "function" && Reveal.isReady();
  }

  function getSlideElements() {
    if (isRevealReady() && typeof Reveal.getSlides === "function") {
      return Reveal.getSlides();
    }
    return Array.prototype.slice.call(document.querySelectorAll(".reveal .slides > section"));
  }

  function getCurrentSlideIndex() {
    if (isRevealReady() && typeof Reveal.getState === "function" && Reveal.getState()) {
      return Reveal.getState().indexh || 0;
    }
    return fallbackIdx;
  }

  function applyFallbackSlideState(idx) {
    var slides = getSlideElements();
    if (!slides.length) return;
    fallbackIdx = Math.max(0, Math.min(slides.length - 1, idx));
    slides.forEach(function (sec, i) {
      sec.classList.toggle("present", i === fallbackIdx);
      sec.classList.toggle("past", i < fallbackIdx);
      sec.classList.toggle("future", i > fallbackIdx);
      if (!isRevealReady()) {
        sec.style.display = i === fallbackIdx ? "block" : "none";
      }
    });
    if (!isRevealReady()) {
      try {
        history.replaceState(null, "", "#/" + fallbackIdx);
      } catch (e) {}
      updatePresentationHUD();
    }
  }

  function goToSlide(idx) {
    var slides = getSlideElements();
    var total = slides.length || 8;
    var target = Math.max(0, Math.min(total - 1, idx));
    if (isRevealReady()) {
      Reveal.slide(target);
    } else {
      applyFallbackSlideState(target);
    }
  }

  function nextSlide() {
    var slides = getSlideElements();
    var idx = getCurrentSlideIndex();
    if (idx < slides.length - 1) {
      goToSlide(idx + 1);
    }
  }

  function prevSlide() {
    var idx = getCurrentSlideIndex();
    if (idx > 0) {
      goToSlide(idx - 1);
    }
  }

  function toggleOverviewMode() {
    if (isRevealReady() && typeof Reveal.toggleOverview === "function") {
      Reveal.toggleOverview();
    } else {
      var rev = document.getElementById("revealDeck");
      if (rev) rev.classList.toggle("overview");
    }
  }

  /* ---------- Ajuste Dinámico de Geometría Móvil (Cero Solapamiento) ---------- */
  function syncMobileViewportOffsets() {
    var topbar = document.querySelector(".apple-topbar");
    var dock = document.querySelector(".apple-bottom-dock");
    var root = document.documentElement;
    if (topbar) {
      var th = Math.ceil(topbar.getBoundingClientRect().height);
      if (th > 0) root.style.setProperty("--topbar-offset", th + "px");
    }
    if (dock) {
      var dh = Math.ceil(dock.getBoundingClientRect().height);
      if (dh > 0) root.style.setProperty("--dock-offset", dh + "px");
    }
  }

  /* ---------- HUD y Estudio de Orador 4 Tarjetas (/web-presentation-pro) ---------- */
  function formatSpeakerNotesHtml(rawNotes) {
    var safe = String(rawNotes || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return safe
      .replace(/\[SEÑALAR:([^\]]+)\]/g, '<strong class="text-accent">[SEÑALAR:$1]</strong>')
      .replace(/\[PAUSA\]/g, '<strong class="text-amber">[PAUSA]</strong>');
  }

  function updatePresentationHUD() {
    syncMobileViewportOffsets();
    var slides = getSlideElements();
    if (!slides.length) return;
    var total = slides.length || 8;
    var idx = getCurrentSlideIndex();
    var currentSlide = slides[idx];
    var nextSlideEl = slides[idx + 1];

    var numStr = String(idx + 1).padStart(2, "0") + " / " + String(total).padStart(2, "0");
    var shortTitle = SHORT_TITLES[idx] || ("Lámina " + (idx + 1));

    // Actualizar Dock Inferior
    setText("dockSlideNum", numStr);
    setText("dockSlideTitle", shortTitle);
    var fill = document.getElementById("dockProgressFill");
    if (fill) {
      fill.style.width = (((idx + 1) / total) * 100).toFixed(2) + "%";
    }
    var nextBtnText = document.getElementById("nextSlideBtnText");
    if (nextBtnText) {
      nextBtnText.textContent = idx >= total - 1 ? "Inicio" : "Siguiente";
    }

    // Actualizar Pastillas de Navegación Superior
    var stepPills = document.querySelectorAll(".step-pill[data-slide-to]");
    stepPills.forEach(function (btn) {
      var targetIdx = parseInt(btn.getAttribute("data-slide-to"), 10);
      var active = targetIdx === idx;
      btn.classList.toggle("is-active", active);
      if (active && typeof btn.scrollIntoView === "function") {
        btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    });

    // Actualizar Teleprompter [N] y Estudio 4 Tarjetas [P]
    var noteText = currentSlide ? (currentSlide.getAttribute("data-notes") || "") : "";
    var currTitle = currentSlide ? (currentSlide.getAttribute("data-title") || shortTitle) : shortTitle;
    var currLayout = currentSlide ? (currentSlide.getAttribute("data-layout") || "SLIDE") : "SLIDE";

    var notesContentEl = document.getElementById("notes-content");
    if (notesContentEl) {
      notesContentEl.innerHTML = formatSpeakerNotesHtml(noteText);
    }

    setText("studio-curr-idx", numStr);
    setText("studio-curr-layout", "LAYOUT // " + currLayout);
    setText("studio-curr-title", currTitle);

    var studioScriptEl = document.getElementById("studio-script");
    if (studioScriptEl) {
      studioScriptEl.innerHTML = formatSpeakerNotesHtml(noteText);
    }

    if (nextSlideEl) {
      setText("studio-next-idx", String(idx + 2).padStart(2, "0"));
      setText("studio-next-layout", "PRÓXIMO // " + (nextSlideEl.getAttribute("data-layout") || "SLIDE"));
      setText("studio-next-title", nextSlideEl.getAttribute("data-title") || ("Lámina " + (idx + 2)));
      setText("studio-next-notes", nextSlideEl.getAttribute("data-notes") || "");
    } else {
      setText("studio-next-idx", "FIN");
      setText("studio-next-layout", "CIERRE");
      setText("studio-next-title", "Fin de la presentación");
      setText("studio-next-notes", "Usa ← o Inicio para volver a la portada.");
    }
  }

  /* ---------- Tema Claro / Oscuro [T] ---------- */
  var isDark = true;
  function toggleTheme() {
    isDark = !isDark;
    var root = document.documentElement;
    root.classList.toggle("dark", isDark);
    root.classList.toggle("mz-papel", !isDark);
    setText("themeIconLabel", isDark ? "☀︎" : "☾");
  }

  function toggleNotesDrawer() {
    var drawer = document.getElementById("notes-drawer");
    if (!drawer) return;
    if (drawer.hasAttribute("hidden")) {
      drawer.removeAttribute("hidden");
    } else {
      drawer.setAttribute("hidden", "");
    }
    updatePresentationHUD();
  }

  function togglePresenterStudio() {
    var studio = document.getElementById("presenter-studio");
    if (!studio) return;
    if (studio.hasAttribute("hidden")) {
      studio.removeAttribute("hidden");
    } else {
      studio.setAttribute("hidden", "");
    }
    updatePresentationHUD();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(function () {});
    } else {
      document.exitFullscreen().catch(function () {});
    }
  }

  /* ---------- Inicialización General ---------- */
  var startTime = Date.now();
  function resetTimer() {
    startTime = Date.now();
  }

  function bindEvents() {
    window.addEventListener("resize", syncMobileViewportOffsets, { passive: true });
    window.addEventListener("orientationchange", syncMobileViewportOffsets, { passive: true });

    // Pastillas de pasos superiores
    document.querySelectorAll(".step-pill[data-slide-to]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = parseInt(btn.getAttribute("data-slide-to"), 10);
        if (!isNaN(target)) {
          goToSlide(target);
        }
      });
    });

    // Botones Anterior / Siguiente del Dock Inferior
    var prevBtn = document.getElementById("prevSlideBtn");
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        prevSlide();
      });
    }

    var nextBtn = document.getElementById("nextSlideBtn");
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        var slides = getSlideElements();
        var idx = getCurrentSlideIndex();
        if (idx >= slides.length - 1) {
          goToSlide(0);
        } else {
          nextSlide();
        }
      });
    }

    // En modo Mosaico [ESC] en móvil/tablet, tocar cualquier lámina salta a ella y cierra Mosaico
    document.querySelectorAll(".reveal .slides > section").forEach(function (sec, idx) {
      sec.addEventListener("click", function () {
        var rev = document.getElementById("revealDeck");
        var inOverview = (isRevealReady() && Reveal.isOverview && Reveal.isOverview()) ||
          (rev && rev.classList.contains("overview"));
        if (inOverview && window.innerWidth <= 900) {
          goToSlide(idx);
          toggleOverviewMode();
        }
      });
    });

    // Gestos táctiles pasivos estilo Apple (permite scroll vertical 100% nativo y swipe horizontal limpio)
    var revealEl = document.getElementById("revealDeck");
    if (revealEl) {
      var swipeStartX = 0;
      var swipeStartY = 0;
      var swipeIgnored = false;
      var swipeActive = false;

      function shouldIgnoreSwipe(target) {
        if (!target || typeof target.closest !== "function") return false;
        return Boolean(
          target.closest("[data-prevent-swipe], .mz-table-scroll, .topbar-steps, input, textarea, select, button, a")
        );
      }

      revealEl.addEventListener("touchstart", function (e) {
        if (!e.touches || e.touches.length !== 1) return;
        swipeIgnored = shouldIgnoreSwipe(e.target);
        swipeStartX = e.touches[0].clientX;
        swipeStartY = e.touches[0].clientY;
        swipeActive = true;
      }, { passive: true });

      revealEl.addEventListener("touchend", function (e) {
        if (!swipeActive || swipeIgnored || !e.changedTouches || !e.changedTouches.length) {
          swipeActive = false;
          return;
        }
        swipeActive = false;
        var dx = e.changedTouches[0].clientX - swipeStartX;
        var dy = e.changedTouches[0].clientY - swipeStartY;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.8) {
          if (dx < 0) nextSlide();
          else prevSlide();
        }
      }, { passive: true });
    }

    // Botones HUD Superiores
    var btnStudio = document.getElementById("btnToggleStudio");
    if (btnStudio) btnStudio.addEventListener("click", togglePresenterStudio);

    var btnCloseStudio = document.getElementById("btnCloseStudio");
    if (btnCloseStudio) btnCloseStudio.addEventListener("click", togglePresenterStudio);

    var btnNotes = document.getElementById("btnToggleNotes");
    if (btnNotes) btnNotes.addEventListener("click", toggleNotesDrawer);

    var btnCloseNotes = document.getElementById("btnCloseNotes");
    if (btnCloseNotes) btnCloseNotes.addEventListener("click", toggleNotesDrawer);

    var btnOverview = document.getElementById("btnToggleOverview");
    if (btnOverview) {
      btnOverview.addEventListener("click", toggleOverviewMode);
    }

    var btnTheme = document.getElementById("btnToggleTheme");
    if (btnTheme) btnTheme.addEventListener("click", toggleTheme);

    var btnFull = document.getElementById("btnFullscreen");
    if (btnFull) btnFull.addEventListener("click", toggleFullscreen);

    // Botones dentro del Presenter Studio [P]
    var studioPrev = document.getElementById("studioPrevBtn");
    if (studioPrev) studioPrev.addEventListener("click", prevSlide);

    var studioNext = document.getElementById("studioNextBtn");
    if (studioNext) studioNext.addEventListener("click", nextSlide);

    var studioReset = document.getElementById("studioResetTimerBtn");
    if (studioReset) studioReset.addEventListener("click", resetTimer);

    // Exportar CSV y Restablecer Acuerdo Oficial
    var csvBtn = document.getElementById("exportCsvBtn");
    if (csvBtn) csvBtn.addEventListener("click", exportSpeiCsv);

    var resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        state = Object.assign({}, DEFAULTS);
        syncInputsFromState();
        renderAll();
      });
    }

    // Inputs del Simulador en Vivo (Slide 08)
    var inputMap = {
      contractGrossInput: "contractGross",
      inpOmarReimb: "omarReimb",
      inpMon30: "mon30",
      inpMon15: "mon15",
      inpViaticos: "viaticos",
      inpIgualaGross: "igualaGross"
    };

    Object.keys(inputMap).forEach(function (inputId) {
      var el = document.getElementById(inputId);
      if (!el) return;
      el.addEventListener("input", function () {
        var val = parseFloat(el.value);
        state[inputMap[inputId]] = Number.isFinite(val) && val >= 0 ? val : 0;
        renderAll();
      });
    });

    // Puntero Láser [L] y Atajos de Teclado de /web-presentation-pro
    var laserActive = false;
    var laserDot = document.getElementById("laser-dot");
    window.addEventListener("mousemove", function (e) {
      if (laserActive && laserDot) {
        laserDot.style.left = e.clientX + "px";
        laserDot.style.top = e.clientY + "px";
      }
    });

    window.addEventListener("keydown", function (e) {
      var tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      var k = e.key.toLowerCase();
      if (k === "t") {
        e.preventDefault();
        toggleTheme();
      } else if (k === "n") {
        e.preventDefault();
        toggleNotesDrawer();
      } else if (k === "p") {
        e.preventDefault();
        togglePresenterStudio();
      } else if (k === "b") {
        e.preventDefault();
        document.body.classList.toggle("low-power");
      } else if (k === "r") {
        e.preventDefault();
        resetTimer();
      } else if (k === "l") {
        e.preventDefault();
        laserActive = !laserActive;
        if (laserDot) laserDot.style.display = laserActive ? "block" : "none";
      } else if (k === "f") {
        e.preventDefault();
        toggleFullscreen();
      } else if (!isRevealReady()) {
        if (e.key === "ArrowRight" || e.key === " ") {
          e.preventDefault();
          nextSlide();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          prevSlide();
        } else if (e.key === "Escape") {
          e.preventDefault();
          toggleOverviewMode();
        }
      }
    });

    // Cronómetro en vivo
    setInterval(function () {
      var sec = Math.floor((Date.now() - startTime) / 1000);
      var m = String(Math.floor(sec / 60)).padStart(2, "0");
      var s = String(sec % 60).padStart(2, "0");
      var formatted = m + ":" + s;
      setText("notes-timer", formatted);
      setText("studio-timer", formatted);
    }, 1000);
  }

  function syncInputsFromState() {
    var pairs = {
      contractGrossInput: state.contractGross,
      inpOmarReimb: state.omarReimb,
      inpMon30: state.mon30,
      inpMon15: state.mon15,
      inpViaticos: state.viaticos,
      inpIgualaGross: state.igualaGross
    };
    Object.keys(pairs).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = pairs[id];
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    syncMobileViewportOffsets();
    renderAll();
    bindEvents();

    if (typeof Reveal !== "undefined") {
      Reveal.initialize({
        width: 1600,
        height: 900,
        margin: 0.02,
        minScale: 0.2,
        maxScale: 1.8,
        scrollActivationWidth: null,
        hash: true,
        transition: "fade",
        transitionSpeed: "fast",
        center: true,
        controls: false,
        progress: false,
        touch: false,
        pdfSeparateFragments: false
      }).then(function () {
        updatePresentationHUD();
      });

      Reveal.on("slidechanged", function () {
        var revealContainer = document.getElementById("revealDeck");
        if (revealContainer && window.innerWidth <= 900) {
          revealContainer.scrollTop = 0;
        }
        updatePresentationHUD();
      });
    } else {
      var initialMatch = (window.location.hash || "").match(/^#\/(\d+)/);
      var startIdx = initialMatch ? parseInt(initialMatch[1], 10) : 0;
      applyFallbackSlideState(startIdx);
    }
  });
})();
