(function($){
  window.App = window.App || {};

  // App state
  window.App.state = window.App.AppStorage.load();

  function currency(n){ return window.App.Utils.formatCurrency(n, window.App.state.settings.currency); }

  // Rendering helpers
  function renderIncome(){
    const rows = [];
    const profiles = window.App.state.profiles;
    profiles.forEach(p=>{
      (p.incomes||[]).forEach(inc=>{
        rows.push(`
          <tr data-id="${inc.id}" data-partner="${p.id}">
            <td>${p.name}</td>
            <td>${inc.label}</td>
            <td class="text-right">${currency(inc.amount)}</td>
            <td class="text-right"><button class="btn-secondary btn-sm del-income">Remove</button></td>
          </tr>
        `);
      });
    });
    $('#incomeRows').html(rows.join(''));
  }

  function renderFixed(){
    const rows = (window.App.state.expenses.fixed||[]).map(item=>`
      <tr data-id="${item.id}">
        <td>${item.label}</td>
        <td class="text-right">${currency(item.amount)}</td>
        <td class="text-right"><button class="btn-secondary btn-sm del-fixed">Remove</button></td>
      </tr>
    `);
    $('#fixedRows').html(rows.join(''));
  }

  function renderVariable(){
    const rows = (window.App.state.expenses.variable||[])
      .sort((a,b)=> (a.date||'').localeCompare(b.date))
      .map(item=>`
        <tr data-id="${item.id}">
          <td>${item.date||''}</td>
          <td>${item.label}</td>
          <td>${item.category||''}</td>
          <td class="text-right">${currency(item.amount)}</td>
          <td class="text-right"><button class="btn-secondary btn-sm del-var">Remove</button></td>
        </tr>
      `);
    $('#varRows').html(rows.join(''));
  }

  function renderDebts(){
    const sorted = window.App.Utils.sortDebtsByAPR(window.App.state.debts||[]);
    const rows = sorted.map((d,idx)=>`
      <tr data-id="${d.id}">
        <td>${d.creditor}</td>
        <td class="text-right">${currency(d.balance)}</td>
        <td class="text-right">${(d.apr||0).toFixed(2)}%</td>
        <td class="text-right">${currency(d.min)}</td>
        <td class="text-right">#${idx+1}</td>
        <td class="text-right"><button class="btn-secondary btn-sm del-debt">Remove</button></td>
      </tr>
    `);
    $('#debtRows').html(rows.join(''));
    const total = window.App.Utils.sumBy(window.App.state.debts||[], 'balance');
    const minTotal = window.App.Utils.sumBy(window.App.state.debts||[], 'min');
    const wapr = window.App.Utils.weightedAPR(window.App.state.debts||[]);
    $('#debtTotal').text(currency(total));
    $('#debtMinTotal').text(currency(minTotal));
    $('#debtWAPR').text(`${wapr.toFixed(2)}%`);
  }

  function renderInvestments(){
    const rows = (window.App.state.investments||[]).sort((a,b)=> (a.date||'').localeCompare(b.date)).map(item=>`
      <tr data-id="${item.id}">
        <td>${item.date||''}</td>
        <td>${item.name}</td>
        <td>${item.type}</td>
        <td class="text-right">${currency(item.amount)}</td>
        <td class="text-right"><button class="btn-secondary btn-sm del-inv">Remove</button></td>
      </tr>
    `);
    $('#invRows').html(rows.join(''));
  }

  function renderKidsInvestments(){
    const rows = (window.App.state.kidsInvestments||[])
      .sort((a,b)=> (a.date||'').localeCompare(b.date))
      .map(item=>`
        <tr data-id="${item.id}">
          <td>${item.date||''}</td>
          <td>${item.name}</td>
          <td>${item.type}</td>
          <td class="text-right">${currency(item.amount)}</td>
          <td class="text-right"><button class="btn-secondary btn-sm del-kids-inv">Remove</button></td>
        </tr>
      `);
    $('#kidsInvRows').html(rows.join(''));
  }

  function renderKidsNames(){
    const rows = (window.App.state.kids||[]).map(k=>`
      <tr data-id="${k.id}">
        <td>${k.name}</td>
        <td class="text-right"><button class="btn-secondary btn-sm del-kid">Remove</button></td>
      </tr>
    `);
    $('#kidsNamesRows').html(rows.join(''));
  }

  function suggestionsFor(risk){
    // Base suggestions vary by risk; amounts filled in dashboard based on targets
    const groups = {
      conservative: [
        {name:'BND', type:'Bond Fund', desc:'Broad US investment-grade bond fund'},
        {name:'VOO', type:'S&P ETF', desc:'Low-cost S&P 500 index fund'},
        {name:'VNQ', type:'Real Estate ETF', desc:'US real estate investment trusts'}
      ],
      moderate: [
        {name:'VOO', type:'S&P ETF', desc:'S&P 500 exposure for growth'},
        {name:'BND', type:'Bond Fund', desc:'Stability and income'},
        {name:'VNQ', type:'Real Estate ETF', desc:'Diversify with REITs'}
      ],
      growth: [
        {name:'VOO', type:'S&P ETF', desc:'Core growth exposure'},
        {name:'IVV', type:'S&P ETF', desc:'Alternate S&P 500 option'},
        {name:'VNQ', type:'Real Estate ETF', desc:'Real estate diversification'}
      ]
    };
    return groups[risk] || groups.moderate;
  }

  function renderSuggestionList(){
    const risk = $('#riskLevel').val() || 'moderate';
    const suggestions = suggestionsFor(risk);
    const list = suggestions.map(s=>`
      <div class="p-4 rounded-xl bg-white ring-1 ring-black/5 flex items-center justify-between gap-4">
        <div class="flex-1 min-w-0">
          <p class="font-medium truncate">${s.name} <span class="text-xs muted">(${s.type})</span></p>
          <p class="text-sm muted mt-1 truncate">${s.desc || ''}</p>
        </div>
        <button class="btn-secondary btn-sm quick-add flex-shrink-0" data-name="${s.name}" data-type="${s.type}">Quick add</button>
      </div>
    `);
    $('#suggList').html(list.join(''));
  }

  function renderLessons(){
    const parents = (window.App.state.lessons||[]).filter(l=>l.target==='parents');
    const kids = (window.App.state.lessons||[]).filter(l=>l.target==='kids');
    const parentCards = parents.map(l=>`
      <article class="p-5 rounded-xl bg-white ring-1 ring-black/5">
        <h4 class="font-heading text-lg">${l.title}</h4>
        <p class="text-sm muted mt-1">${l.body}</p>
        <button class="btn-secondary mt-3 toggle-lesson" data-id="${l.id}">${l.done? 'Completed':'Mark complete'}</button>
      </article>
    `);
    $('#lessonList').html(parentCards.join(''));

    const kidCards = kids.map(l=>`
      <article class="p-5 rounded-xl bg-white ring-1 ring-black/5">
        <h4 class="font-heading text-lg">${l.title}</h4>
        <p class="text-sm muted mt-1">${l.body}</p>
        <button class="btn-secondary mt-3 toggle-lesson" data-id="${l.id}">${l.done? 'Completed':'Mark complete'}</button>
      </article>
    `);
    $('#kidsList').html(kidCards.join(''));

    // Snapshot numbers
    const doneCount = (window.App.state.lessons||[]).filter(l=>!!l.done).length;
    $('#snapLessons').text(doneCount);
  }

  function totalsForMonth(isoMonth){
    const income = window.App.state.profiles.reduce((acc,p)=> acc + window.App.Utils.sumBy(p.incomes||[], 'amount'), 0);
    const fixed = window.App.Utils.sumBy(window.App.state.expenses.fixed||[], 'amount');
    const variable = window.App.Utils.sumBy(window.App.Utils.byMonth(window.App.state.expenses.variable||[], isoMonth), 'amount');
    const debtMins = window.App.Utils.sumBy(window.App.state.debts||[], 'min');
    return { income, fixed, variable, debtMins };
  }

  function renderDashboard(){
    const isoMonth = $('#planMonth').val() || window.App.state.settings.month;
    const t = totalsForMonth(isoMonth);
    const totalExp = t.fixed + t.variable;
    $('#dashIncome').text(currency(t.income));
    $('#dashExpenses').text(currency(totalExp));
    $('#dashDebtMins').text(currency(t.debtMins));

    // Targets
    const plan = window.App.state.plan[isoMonth] || { savingsTarget: 200, investTarget: 200 };
    $('#savingsTarget').val(plan.savingsTarget);
    $('#investTarget').val(plan.investTarget);
    $('#savingsTargetLabel').text(currency(plan.savingsTarget));
    $('#investTargetLabel').text(currency(plan.investTarget));

    const remainder = t.income - totalExp - t.debtMins - plan.savingsTarget - plan.investTarget;
    const remFmt = currency(remainder);
    $('#planRemainder').text(remFmt);

    // Suggestions split
    const risk = $('#riskLevel').val();
    const spRatio = risk==='growth'? 0.7 : (risk==='moderate'? 0.5 : 0.35);
    const reRatio = risk==='growth'? 0.2 : (risk==='moderate'? 0.3 : 0.25);
    const stRatio = 1 - spRatio - reRatio; // stable
    const inv = plan.investTarget;
    $('#suggSP').text(currency(inv*spRatio));
    $('#suggRE').text(currency(inv*reRatio));
    $('#suggStable').text(currency(inv*stRatio));

    // Snapshot
    const owed = window.App.Utils.sumBy(window.App.state.debts||[], 'balance');
    $('#snapOwed').text(currency(owed));
    $('#snapInvests').text((window.App.state.investments||[]).length);

    // Kids plan suggestion based on invest target
    $('#kids529').text(currency(inv*0.1));
    $('#kidsCust').text(currency(inv*0.05));
    $('#kidsSave').text(currency(inv*0.05));
  }

  function bindNav(){
    // Delegate to tolerate malformed class names and stray spaces in data-tab
    $(document).on('click', '[data-tab]', function(){
      const raw = $(this).attr('data-tab') || $(this).data('tab') || '';
      let tab = String(raw).trim().toLowerCase();
      // Normalize common singulars
      if(tab === 'income') tab = 'incomes';
      if(tab === 'debt') tab = 'debts';
      if(tab === 'expense') tab = 'expenses';
      const $panel = $('#' + tab);
      if($panel.length){
        $('.tab-panel').addClass('hidden');
        $panel.removeClass('hidden');
        $('html,body').animate({scrollTop: 0}, 200);
      } else {
        console.warn('Tab panel not found for', raw, '=>', tab);
      }
    });
  }

  function bindForms(){

    // Partner names
    $('#partnerNamesForm').on('submit', function(e){
      e.preventDefault();
      const a = ($('#partnerAName').val()||'').trim();
      const b = ($('#partnerBName').val()||'').trim();
      const profiles = window.App.state.profiles || [];
      if(profiles[0]) profiles[0].name = a || 'Partner A';
      if(profiles[1]) profiles[1].name = b || 'Partner B';
      window.App.AppStorage.save(window.App.state);
      populateOptions();
      renderIncome(); renderDashboard();
    });

    // Kids names
    $('#kidForm').on('submit', function(e){
      e.preventDefault();
      const name = ($('#kidName').val()||'').trim();
      if(!name) return;
      window.App.state.kids = window.App.state.kids || [];
      window.App.state.kids.push({ id: window.App.Utils.uid('kid'), name });
      window.App.AppStorage.save(window.App.state);
      $('#kidName').val('');
      renderKidsNames();
    });
    $('#kidsNamesRows').on('click', '.del-kid', function(){
      const id = $(this).closest('tr').data('id');
      window.App.state.kids = (window.App.state.kids||[]).filter(x=>x.id!==id);
      window.App.AppStorage.save(window.App.state);
      renderKidsNames();
    });

    $('#incomeForm').on('submit', function(e){
      e.preventDefault();
      const partnerName = $('#incomePartner').val();
      const label = $('#incomeLabel').val().trim();
      const amount = window.App.Utils.parseNumber($('#incomeAmount').val());
      if(!label || amount<=0) return;
      const partner = window.App.state.profiles.find(p=>p.name===partnerName) || window.App.state.profiles[0];
      partner.incomes = partner.incomes || [];
      partner.incomes.push({ id: window.App.Utils.uid('inc'), label, amount });
      window.App.AppStorage.save(window.App.state);
      $('#incomeLabel').val(''); $('#incomeAmount').val('');
      renderIncome(); renderDashboard();
    });
    $('#incomeRows').on('click', '.del-income', function(){
      const tr = $(this).closest('tr');
      const id = tr.data('id');
      const pid = tr.data('partner');
      const p = window.App.state.profiles.find(x=>x.id===pid);
      if(p){ p.incomes = (p.incomes||[]).filter(i=>i.id!==id); }
      window.App.AppStorage.save(window.App.state);
      renderIncome(); renderDashboard();
    });

    $('#fixedForm').on('submit', function(e){
      e.preventDefault();
      const label = $('#fixedLabel').val().trim();
      const amount = window.App.Utils.parseNumber($('#fixedAmount').val());
      if(!label || amount<=0) return;
      window.App.state.expenses.fixed.push({ id: window.App.Utils.uid('fix'), label, amount });
      window.App.AppStorage.save(window.App.state);
      $('#fixedLabel').val(''); $('#fixedAmount').val('');
      renderFixed(); renderDashboard();
    });
    $('#fixedRows').on('click', '.del-fixed', function(){
      const id = $(this).closest('tr').data('id');
      window.App.state.expenses.fixed = (window.App.state.expenses.fixed||[]).filter(x=>x.id!==id);
      window.App.AppStorage.save(window.App.state);
      renderFixed(); renderDashboard();
    });

    $('#variableForm').on('submit', function(e){
      e.preventDefault();
      const label = $('#varLabel').val().trim();
      const category = $('#varCategory').val();
      const date = $('#varDate').val() || window.App.Utils.todayISO();
      const amount = window.App.Utils.parseNumber($('#varAmount').val());
      if(!label || amount<=0) return;
      window.App.state.expenses.variable.push({ id: window.App.Utils.uid('var'), label, category, date, amount });
      window.App.AppStorage.save(window.App.state);
      $('#varLabel').val(''); $('#varAmount').val('');
      renderVariable(); renderDashboard();
    });
    $('#varRows').on('click', '.del-var', function(){
      const id = $(this).closest('tr').data('id');
      window.App.state.expenses.variable = (window.App.state.expenses.variable||[]).filter(x=>x.id!==id);
      window.App.AppStorage.save(window.App.state);
      renderVariable(); renderDashboard();
    });

    $('#debtForm').on('submit', function(e){
      e.preventDefault();
      const creditor = $('#debtCreditor').val().trim();
      const balance = window.App.Utils.parseNumber($('#debtBalance').val());
      const apr = window.App.Utils.parseNumber($('#debtAPR').val());
      const min = window.App.Utils.parseNumber($('#debtMin').val());
      if(!creditor || balance<=0) return;
      window.App.state.debts.push({ id: window.App.Utils.uid('debt'), creditor, balance, apr, min });
      window.App.AppStorage.save(window.App.state);
      $('#debtCreditor').val(''); $('#debtBalance').val(''); $('#debtAPR').val(''); $('#debtMin').val('');
      renderDebts(); renderDashboard();
    });
    $('#debtRows').on('click', '.del-debt', function(){
      const id = $(this).closest('tr').data('id');
      window.App.state.debts = (window.App.state.debts||[]).filter(x=>x.id!==id);
      window.App.AppStorage.save(window.App.state);
      renderDebts(); renderDashboard();
    });

    $('#addInvestBtn').on('click', function(){ $('#investForm').toggleClass('hidden'); });
    $('#investForm').on('submit', function(e){
      e.preventDefault();
      const name = $('#invName').val().trim();
      const type = $('#invType').val();
      const date = $('#invDate').val() || window.App.Utils.todayISO();
      const amount = window.App.Utils.parseNumber($('#invAmount').val());
      if(!name || amount<=0) return;
      window.App.state.investments.push({ id: window.App.Utils.uid('inv'), name, type, date, amount });
      window.App.AppStorage.save(window.App.state);
      $('#invName').val(''); $('#invAmount').val('');
      renderInvestments(); renderDashboard();
    });
    $('#invRows').on('click', '.del-inv', function(){
      const id = $(this).closest('tr').data('id');
      window.App.state.investments = (window.App.state.investments||[]).filter(x=>x.id!==id);
      window.App.AppStorage.save(window.App.state);
      renderInvestments(); renderDashboard();
    });
    $('#suggList').on('click', '.quick-add', function(){
      const name = $(this).data('name');
      const type = $(this).data('type');
      const date = window.App.Utils.todayISO();
      const amt = window.App.Utils.parseNumber($('#investTarget').val())/3; // quick average allocation
      window.App.state.investments.push({ id: window.App.Utils.uid('inv'), name, type, date, amount: amt });
      window.App.AppStorage.save(window.App.state);
      renderInvestments(); renderDashboard();
    });

    // Learning materials (parents)
    $('#learnAddBtn').on('click', function(){ $('#learnForm').toggleClass('hidden'); });
    $('#learnForm').on('submit', function(e){
      e.preventDefault();
      const title = $('#learnTitle').val().trim();
      const kind = $('#learnType').val();
      const url = $('#learnUrl').val().trim();
      if(!title || !url) return;
      window.App.state.lessons = window.App.state.lessons || [];
      window.App.state.lessons.push({ id: window.App.Utils.uid('lesson'), title, body:'', url, kind, target:'parents', done:false });
      window.App.AppStorage.save(window.App.state);
      $('#learnTitle').val(''); $('#learnUrl').val('');
      renderLessons();

    renderKidsNames();
    });
    // Learning materials (parents)
    $('#kidsLearnAddBtn').on('click', function(){ $('#kidsLearnForm').toggleClass('hidden'); });
    $('#kidsLearnForm').on('submit', function(e){
      e.preventDefault();
      const title = $('#kidsLearnTitle').val().trim();
      const kind = $('#kidsLearnType').val();
      const url = $('#kidsLearnUrl').val().trim();
      if(!title || !url) return;
      window.App.state.lessons = window.App.state.lessons || [];
      window.App.state.lessons.push({ id: window.App.Utils.uid('lesson'), title, body:'', url, kind, target:'kids', done:false });
      window.App.AppStorage.save(window.App.state);
      $('#kidsLearnTitle').val(''); $('#kidsLearnUrl').val('');
      renderLessons();
    });

    // Kids investments
    $('#kidsAddInvestBtn').on('click', function(){ $('#kidsInvestForm').toggleClass('hidden'); });
    $('#kidsInvestForm').on('submit', function(e){
      e.preventDefault();
      const name = $('#kidsInvName').val().trim();
      const type = $('#kidsInvType').val();
      const date = $('#kidsInvDate').val() || window.App.Utils.todayISO();
      const amount = window.App.Utils.parseNumber($('#kidsInvAmount').val());
      if(!name || amount<=0) return;
      window.App.state.kidsInvestments = window.App.state.kidsInvestments || [];
      window.App.state.kidsInvestments.push({ id: window.App.Utils.uid('kinv'), name, type, date, amount });
      window.App.AppStorage.save(window.App.state);
      $('#kidsInvName').val(''); $('#kidsInvAmount').val('');
      renderKidsInvestments(); renderDashboard();
    });
    $('#kidsInvRows').on('click', '.del-kids-inv', function(){
      const id = $(this).closest('tr').data('id');
      window.App.state.kidsInvestments = (window.App.state.kidsInvestments||[]).filter(x=>x.id!==id);
      window.App.AppStorage.save(window.App.state);
      renderKidsInvestments(); renderDashboard();
    });

    $('#riskLevel').on('change', function(){ renderSuggestionList(); renderDashboard(); });

    $('#planMonth').on('change', function(){
      const iso = $(this).val();
      if(!iso) return;
      window.App.state.settings.month = iso;
      window.App.AppStorage.save(window.App.state);
      renderDashboard();
    });
    $('#savingsTarget, #investTarget').on('input', function(){
      const iso = $('#planMonth').val() || window.App.state.settings.month;
      const s = window.App.Utils.parseNumber($('#savingsTarget').val());
      const i = window.App.Utils.parseNumber($('#investTarget').val());
      window.App.state.plan[iso] = { savingsTarget: s, investTarget: i };
      $('#savingsTargetLabel').text(currency(s));
      $('#investTargetLabel').text(currency(i));
      window.App.AppStorage.save(window.App.state);
      renderDashboard();
    });

    $('#lessonList, #kidsList').on('click', '.toggle-lesson', function(){
      const id = $(this).data('id');
      const l = (window.App.state.lessons||[]).find(x=>x.id===id);
      if(l){ l.done = !l.done; window.App.AppStorage.save(window.App.state); }
      renderLessons();
    });
  }

  function populateOptions(){
    const cats = window.App.Defaults.categories;
    $('#varCategory').html(cats.map(c=>`<option>${c}</option>`).join(''));

    const profiles = window.App.state.profiles || [];
    $('#incomePartner').html(profiles.map(p=>`<option>${p.name}</option>`).join(''));
    $('#partnerAName').val(profiles[0] ? profiles[0].name : '');
    $('#partnerBName').val(profiles[1] ? profiles[1].name : '');
    $('#planMonth').val(window.App.state.settings.month);
  }

  // Public API
  window.App.init = function(){
    populateOptions();
    bindNav();
    bindForms();
    renderSuggestionList();
  };

  window.App.render = function(){
    renderIncome();
    renderFixed();
    renderVariable();
    renderDebts();
    renderInvestments();
    renderLessons();
    renderDashboard();
  };

})(jQuery);
