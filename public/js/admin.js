// HC Dinan-Quévert — interactions de l'espace administrateur
(function () {
  'use strict';

  // --- Ajout / retrait de lignes dans un éditeur de liste (effectif, composition) ---
  function wireEditor(editor, rowTemplate, addBtn) {
    if (!editor) return;
    editor.addEventListener('click', function (e) {
      var btn = e.target.closest('.roster-editor__remove') || e.target.closest('.row-remove');
      if (btn) {
        var row = btn.closest('.roster-editor__row') || btn.closest('tr');
        if (row) row.remove();
      }
    });
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        editor.insertAdjacentHTML('beforeend', rowTemplate);
      });
    }
  }

  var rosterEditor = document.getElementById('rosterEditor');
  if (rosterEditor) {
    var tpl = '<div class="roster-editor__row">' +
      '<input class="field__input roster-editor__num" name="joueurs[numero]" type="text" placeholder="N°">' +
      '<input class="field__input" name="joueurs[nom]" type="text" placeholder="Nom du joueur">' +
      '<input class="field__input roster-editor__poste" name="joueurs[poste]" type="text" placeholder="Poste">' +
      '<button type="button" class="btn btn--danger btn--sm roster-editor__remove" aria-label="Retirer cette ligne">×</button>' +
      '</div>';
    wireEditor(rosterEditor, tpl, document.getElementById('addRosterRow'));
  }

  var compEditor = document.getElementById('compEditor');
  if (compEditor) {
    var tplComp = '<div class="roster-editor__row">' +
      '<input class="field__input" name="joueurs[nom]" type="text" placeholder="Nom du joueur">' +
      '<select class="field__input roster-editor__poste" name="joueurs[poste]">' +
      '<option value="Joueur">Joueur</option><option value="Gardien">Gardien</option></select>' +
      '<label class="check roster-editor__present"><input type="checkbox" name="joueurs[present]" value="" checked> Présent</label>' +
      '<button type="button" class="btn btn--danger btn--sm roster-editor__remove" aria-label="Retirer cette ligne">×</button>' +
      '</div>';
    wireEditor(compEditor, tplComp, document.getElementById('addCompRow'));

    var fillBtn = document.getElementById('fillFromRoster');
    var dataEl = document.getElementById('rosterData');
    if (fillBtn && dataEl) {
      fillBtn.addEventListener('click', function () {
        var data = JSON.parse(dataEl.textContent);
        var slug = (document.getElementById('equipeSlug') || {}).value;
        var team = data.find(function (t) { return t.slug === slug; }) || { joueurs: [] };
        if (!team.joueurs.length) { alert('Aucun effectif enregistré pour cette équipe.'); return; }
        compEditor.innerHTML = '';
        team.joueurs.forEach(function (nom, i) {
          var poste = i === 0 ? 'Gardien' : 'Joueur';
          compEditor.insertAdjacentHTML('beforeend',
            '<div class="roster-editor__row">' +
            '<input class="field__input" name="joueurs[nom]" type="text" value="' + nom + '">' +
            '<select class="field__input roster-editor__poste" name="joueurs[poste]">' +
            '<option value="Joueur"' + (poste === 'Joueur' ? ' selected' : '') + '>Joueur</option>' +
            '<option value="Gardien"' + (poste === 'Gardien' ? ' selected' : '') + '>Gardien</option></select>' +
            '<label class="check roster-editor__present"><input type="checkbox" name="joueurs[present]" value="' + i + '" checked> Présent</label>' +
            '<button type="button" class="btn btn--danger btn--sm roster-editor__remove" aria-label="Retirer cette ligne">×</button>' +
            '</div>');
        });
      });
    }
  }

  // --- Confirmation avant envoi (formulaires marqués data-confirm) ---
  document.querySelectorAll('form[data-confirm]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!window.confirm(form.getAttribute('data-confirm'))) e.preventDefault();
    });
  });

  // --- Classement : ajout / retrait de lignes ---
  var classRows = document.getElementById('classementRows');
  if (classRows) {
    var addRow = document.getElementById('addRow');
    wireEditor(classRows, '', addRow);
    if (addRow) {
      addRow.addEventListener('click', function () {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td><span class="pos">+</span></td>' +
          '<td class="ta-l"><input class="field__input field__input--cell" name="equipe" type="text" required></td>' +
          '<td><input class="field__input field__input--cell field__input--num" name="pts" type="number" value="0"></td>' +
          '<td><input class="field__input field__input--cell field__input--num" name="j" type="number" value="0"></td>' +
          '<td><input class="field__input field__input--cell field__input--num" name="g" type="number" value="0"></td>' +
          '<td><input class="field__input field__input--cell field__input--num" name="n" type="number" value="0"></td>' +
          '<td><input class="field__input field__input--cell field__input--num" name="p" type="number" value="0"></td>' +
          '<td><input class="field__input field__input--cell field__input--num" name="bp" type="number" value="0"></td>' +
          '<td><input class="field__input field__input--cell field__input--num" name="bc" type="number" value="0"></td>' +
          '<td><button type="button" class="btn btn--danger btn--sm row-remove" aria-label="Retirer la ligne">×</button></td>';
        classRows.appendChild(tr);
      });
    }
  }
})();
