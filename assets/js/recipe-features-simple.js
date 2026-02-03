/**
 * CJC Recipe Features - Simple Version
 */
(function() {
    'use strict';

    var SAVED_KEY = 'cjc_saved_recipes';

    function init() {
        var saveBtn = document.getElementById('cjc-save-btn');
        if (saveBtn) {
            updateSaveButton(saveBtn);
            saveBtn.addEventListener('click', function() {
                toggleSave();
                updateSaveButton(saveBtn);
            });
        }
    }

    function getSaved() {
        try {
            var data = localStorage.getItem(SAVED_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    function setSaved(list) {
        try {
            localStorage.setItem(SAVED_KEY, JSON.stringify(list));
        } catch (e) {}
    }

    function isSaved() {
        if (typeof cjcRecipeData === 'undefined') return false;
        var saved = getSaved();
        return saved.some(function(r) { return r.id === cjcRecipeData.postId; });
    }

    function toggleSave() {
        if (typeof cjcRecipeData === 'undefined') return;

        var saved = getSaved();
        var index = -1;
        for (var i = 0; i < saved.length; i++) {
            if (saved[i].id === cjcRecipeData.postId) {
                index = i;
                break;
            }
        }

        if (index !== -1) {
            saved.splice(index, 1);
            showToast('Recipe removed');
        } else {
            saved.push({
                id: cjcRecipeData.postId,
                title: cjcRecipeData.postTitle,
                slug: cjcRecipeData.postSlug,
                image: cjcRecipeData.postImage
            });
            showToast('Recipe saved!');
        }
        setSaved(saved);
    }

    function updateSaveButton(btn) {
        if (isSaved()) {
            btn.classList.add('is-saved');
            btn.querySelector('span').textContent = 'Saved';
        } else {
            btn.classList.remove('is-saved');
            btn.querySelector('span').textContent = 'Save';
        }
    }

    function showToast(msg) {
        var container = document.getElementById('cjc-toast-container');
        if (!container) return;

        var toast = document.createElement('div');
        toast.className = 'cjc-toast';
        toast.textContent = msg;
        container.appendChild(toast);

        setTimeout(function() {
            toast.remove();
        }, 3000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
