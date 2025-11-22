(function(){
  // Global namespace
  window.App = window.App || {};

  // Storage manager
  window.App.AppStorage = {
    key: 'familyFinanceData',
    load: function(){
      try{
        const raw = localStorage.getItem(this.key);
        if(!raw) return window.App.Defaults.initialState();
        const data = JSON.parse(raw);
        return Object.assign(window.App.Defaults.initialState(), data);
      }catch(e){
        console.error('Load failed', e);
        return window.App.Defaults.initialState();
      }
    },
    save: function(state){
      try{ localStorage.setItem(this.key, JSON.stringify(state)); }
      catch(e){ console.error('Save failed', e); }
    },
    export: function(){
      try{ return JSON.stringify(localStorage.getItem(this.key)); }catch(e){ return null; }
    },
    import: function(json){
      try{ localStorage.setItem(this.key, json); }catch(e){ console.error('Import failed', e); }
    }
  };

  // Utilities
  window.App.Utils = {
    uid: function(prefix){ return (prefix||'id') + '_' + Math.random().toString(36).slice(2,9); },
    todayISO: function(){ return new Date().toISOString().slice(0,10); },
    monthKey: function(d){ const dt = d? new Date(d): new Date(); return dt.toISOString().slice(0,7); },
    parseNumber: function(v){ const n = parseFloat(v); return isNaN(n)? 0 : n; },
    sumBy: function(arr, sel){ return arr.reduce((a,x)=>a + (typeof sel==='function'? sel(x): (x[sel]||0)), 0); },
    formatCurrency: function(num, currency){
      try{ return new Intl.NumberFormat(undefined, {style:'currency', currency: currency||'USD', maximumFractionDigits:2}).format(num||0); }
      catch(e){ return '$' + (num||0).toFixed(2); }
    },
    percent: function(x, d){ if(d===0) return 0; return Math.round((x/d)*100); },
    clamp: function(num, min, max){ return Math.max(min, Math.min(max, num)); },
    byMonth: function(items, isoMonth){ return items.filter(x=> (x.date||'').startsWith(isoMonth)); },
    weightedAPR: function(debts){
      const total = debts.reduce((a,d)=> a + (d.balance||0), 0);
      if(total<=0) return 0;
      const w = debts.reduce((a,d)=> a + (d.balance*(d.apr||0)), 0);
      return w/total;
    },
    sortDebtsByAPR: function(debts){ return [...debts].sort((a,b)=> (b.apr||0) - (a.apr||0)); }
  };

  // Defaults and seed data
  window.App.Defaults = {
    categories: ['Groceries','Dining','Transport','Health','Kids','Utilities','Entertainment','Other'],
    initialState: function(){
      const month = window.App.Utils.monthKey();
      return {
        profiles: [
          { id: 'pA', name: 'Partner A', incomes: [ {id: window.App.Utils.uid('inc'), label:'Salary', amount: 4000} ] },
          { id: 'pB', name: 'Partner B', incomes: [ {id: window.App.Utils.uid('inc'), label:'Salary', amount: 3500} ] }
        ],
        expenses: {
          fixed: [ {id: window.App.Utils.uid('fix'), label:'Rent', amount: 1800}, {id: window.App.Utils.uid('fix'), label:'Internet', amount: 60} ],
          variable: [ {id: window.App.Utils.uid('var'), label:'Groceries', category:'Groceries', date: window.App.Utils.todayISO(), amount: 120} ]
        },
        debts: [ {id: window.App.Utils.uid('debt'), creditor:'Visa', balance: 3200, apr: 19.9, min: 85} ],
        investments: [ ],
        kids: [],

        kidsInvestments: [ ],
        lessons: [
          { id:'l1', title:'Record your inflows and outflows', body:'Use a simple recurring schedule for fixed bills and log variable purchases weekly.', target:'parents', done:false },
          { id:'l2', title:'Separate wants and needs', body:'Label each expense as a need or want to prioritize better during tight months.', target:'parents', done:false },
          { id:'k1', title:'Save, Spend, Share jars', body:'Split allowance into 3 jars. Decide how much goes in each every week.', target:'kids', done:false },
          { id:'k2', title:'Price compare game', body:'Find the best value between two similar items at the store.', target:'kids', done:false }
        ],
        settings: { currency: 'USD', month },
        plan: { }
      };
    }
  };
})();
