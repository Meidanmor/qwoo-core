(function ($) {
    'use strict';

    const ShopBuilder = {

        init: function () {
            this.initProductSearch();
            this.initCategorySearch();
            this.bindEvents();
            this.initHeroImageUpload();
            this.initLogoUpload();
            this.initAppIconUpload();
            this.bindFormSubmit();
            this.bindGithubPush();
            this.initSections();
            this.bindGenerateIcons();
            this.bindContactMethods();
        },

        /* -------------------------
        Generic single-image upload (wp.media) — used for hero image,
        header logo, and app icon. Keeps one implementation instead of
        three near-identical copies.
        ------------------------- */
        bindMediaUpload: function ( opts ) {
            // opts: { uploadBtn, removeBtn, hiddenInput, previewImg, title, changeLabel, selectLabel }
            let uploader;
            const $uploadBtn = $(opts.uploadBtn);
            const $removeBtn = $(opts.removeBtn);
            const $hidden = $(opts.hiddenInput);
            const $preview = $(opts.previewImg);

            $uploadBtn.on('click', function (e) {
                e.preventDefault();

                if (uploader) {
                    uploader.open();
                    return;
                }

                uploader = wp.media({
                    title: opts.title,
                    button: { text: 'Use this image' },
                    multiple: false,
                    library: { type: 'image' }
                });

                uploader.on('select', function () {
                    const attachment = uploader.state().get('selection').first().toJSON();
                    $hidden.val(attachment.id);
                    $preview.attr('src', attachment.url).show();
                    $uploadBtn.text(opts.changeLabel);
                    $removeBtn.show();
                });

                uploader.open();
            });

            $removeBtn.on('click', function (e) {
                e.preventDefault();
                $hidden.val('');
                $preview.hide();
                $uploadBtn.text(opts.selectLabel);
                $(this).hide();
            });
        },

        initHeroImageUpload: function () {
            this.bindMediaUpload({
                uploadBtn: '#hero-image-upload-btn',
                removeBtn: '#hero-image-remove-btn',
                hiddenInput: '#hero-image-id',
                previewImg: '#hero-image-preview',
                title: 'Select Hero Image',
                changeLabel: 'Change Image',
                selectLabel: 'Select Image'
            });
        },

        initLogoUpload: function () {
            this.bindMediaUpload({
                uploadBtn: '#logo-upload-btn',
                removeBtn: '#logo-remove-btn',
                hiddenInput: '#logo-id',
                previewImg: '#logo-preview',
                title: 'Select Header Logo',
                changeLabel: 'Change Logo',
                selectLabel: 'Select Logo'
            });
        },

        initAppIconUpload: function () {
            const self = this;

            $('#app-icon-upload-btn').on('click', function (e) {
                e.preventDefault();

                const uploader = wp.media({
                    title: 'Select App Icon (square, 512x512 or larger)',
                    button: { text: 'Use this image' },
                    multiple: false,
                    library: { type: 'image' }
                });

                uploader.on('select', function () {
                    const attachment = uploader.state().get('selection').first().toJSON();
                    const w = attachment.width || 0;
                    const h = attachment.height || 0;

                    let warning = '';
                    if (w && h) {
                        const ratio = w / h;
                        if (ratio < 0.9 || ratio > 1.1) {
                            warning = 'Heads up: this image isn\'t square, it will be center-cropped.';
                        } else if (w < 512 || h < 512) {
                            warning = 'Heads up: image is smaller than the recommended 512x512 minimum.';
                        }
                    }

                    $('#app-icon-id').val(attachment.id);
                    $('#app-icon-preview').attr('src', attachment.url).show();
                    $('#app-icon-upload-btn').text('Change App Icon');
                    $('#app-icon-remove-btn').show();

                    if (warning) {
                        ShopBuilder.showStatus('⚠️ ' + warning, '#b45309', 6000, '#icon-gen-status');
                    }
                });

                uploader.open();
            });

            $('#app-icon-remove-btn').on('click', function (e) {
                e.preventDefault();
                $('#app-icon-id').val('');
                $('#app-icon-preview').hide();
                $('#app-icon-upload-btn').text('Select App Icon');
                $(this).hide();
            });
        },

        bindGenerateIcons: function () {
            $('#generate-icons-btn').on('click', function (e) {
                e.preventDefault();

                if (!$('#app-icon-id').val()) {
                    ShopBuilder.showStatus('❌ Select and save an App Icon first.', 'red', 5000, '#icon-gen-status');
                    return;
                }

                const $btn = $(this);
                $btn.prop('disabled', true).text('Generating...');
                ShopBuilder.showStatus('⏳ Generating icon set...', '#666', false, '#icon-gen-status');

                $.post(ajaxurl, {
                    action: 'shop_builder_generate_icons',
                    nonce: shopBuilder.nonce
                }, function (response) {
                    if (response.success) {
                        ShopBuilder.showStatus('✅ ' + response.data, 'green', 8000, '#icon-gen-status');
                    } else {
                        ShopBuilder.showStatus('❌ ' + (response.data || 'Unknown error'), 'red', 8000, '#icon-gen-status');
                    }
                }).fail(function () {
                    ShopBuilder.showStatus('❌ Connection error. Please try again.', 'red', 8000, '#icon-gen-status');
                }).always(function () {
                    $btn.prop('disabled', false).text('Generate & Push Icon Set to GitHub');
                });
            });
        },

        /* -------------------------
           Product Search (Select2)
           ------------------------- */
        initProductSearch: function () {
            const $select = $('#hp-product-select');
            const $wrapper = $select.closest('.custom-select-wrapper');

            if (!$select.length || !$.fn.select2) return;

            $select.select2({
                allowClear: true,
                closeOnSelect: false,
                placeholder: $select.data('placeholder'),
                dropdownParent: $wrapper,
                ajax: {
                    url: ajaxurl,
                    dataType: 'json',
                    delay: 250,
                    data: function (params) {
                        return {
                            action: 'shop_builder_product_search',
                            term: params.term,
                            security: shopBuilder.nonce
                        };
                    },
                    processResults: function (data) {
                        return {
                            results: data.map(function (item) {
                                return { id: item.id, text: item.text, thumb: item.thumb };
                            })
                        };
                    },
                    cache: true
                },
                templateResult: function (item) {
                    if (!item.id) return item.text;
                    const img = item.thumb || 'https://via.placeholder.com/40';
                    return $(`
                        <div style="display:flex; align-items:center; gap:10px;">
                            <img src="${img}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;" />
                            <span>${item.text}</span>
                        </div>
                    `);
                },
                templateSelection: function (item) { return item.text; },
                escapeMarkup: function (markup) { return markup; }
            });

            this.bindSelect2OpenBehavior($select);
        },

        /* -------------------------
           Category Search (Select2) — used by the Category Grid section.
           Delegated on the container since section rows are added dynamically.
           ------------------------- */
        initCategorySearch: function () {
            const self = this;

            $(document).on('select2-init-category', '.category-select', function () {
                const $select = $(this);
                if ($select.data('select2')) return; // already initialized
                const $wrapper = $select.closest('.custom-select-wrapper');

                $select.select2({
                    allowClear: true,
                    closeOnSelect: false,
                    placeholder: $select.data('placeholder'),
                    dropdownParent: $wrapper,
                    ajax: {
                        url: ajaxurl,
                        dataType: 'json',
                        delay: 250,
                        data: function (params) {
                            return {
                                action: 'shop_builder_category_search',
                                term: params.term,
                                security: shopBuilder.nonce
                            };
                        },
                        processResults: function (data) {
                            return {
                                results: data.map(function (item) {
                                    return { id: item.id, text: item.text, thumb: item.thumb };
                                })
                            };
                        },
                        cache: true
                    },
                    templateResult: function (item) {
                        if (!item.id) return item.text;
                        const img = item.thumb || 'https://via.placeholder.com/40';
                        return $(`
                            <div style="display:flex; align-items:center; gap:10px;">
                                <img src="${img}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;" />
                                <span>${item.text}</span>
                            </div>
                        `);
                    },
                    templateSelection: function (item) { return item.text; },
                    escapeMarkup: function (markup) { return markup; }
                });

                self.bindSelect2OpenBehavior($select);
            });

            // Initialize any category selects already present on page load.
            $('.category-select').each(function () {
                $(this).trigger('select2-init-category');
            });
        },

        bindSelect2OpenBehavior: function ($select) {
            $(document).on('keyup', '.select2-search__field', function () {
                const term = $(this).val();
                if (term.length > 0) {
                    $select.select2('open');
                    $(this).focus();
                }
            });

            $select
                .on('select2:open', function () {
                    const $searchField = $('.select2 .select2-search__field');
                    if ($searchField.length > 0 && !$searchField.val()) {
                        $(this).select2('close');
                    }
                })
                .on('select2:unselect', function (e) {
                    const idToRemove = e.params.data.id;
                    $(this).find('option[value="' + idToRemove + '"]').remove();
                    $(this).trigger('change');
                    const self = $(this);
                    setTimeout(function () { self.select2('close'); }, 1);
                })
                .on('select2:clearing', function () {
                    $(this).empty().trigger('change');
                });
        },

        /* -------------------------
           Homepage Sections: add / remove / reorder / reindex / collapse
           ------------------------- */
        initSections: function () {
            const self = this;
            const $container = $('#sections-container');

            // Drag to reorder.
            if ($.fn.sortable) {
                $container.sortable({
                    handle: '.section-drag-handle',
                    axis: 'y',
                    placeholder: 'section-row-placeholder',
                    update: function () { self.reindexSections(); }
                });
            }

            $('#add-section-btn').on('click', function (e) {
                e.preventDefault();
                const type = $('#add-section-type').val();
                self.addSection(type);
            });

            $container.on('click', '.remove-section-btn', function (e) {
                e.preventDefault();
                if (!confirm('Remove this section?')) return;
                $(this).closest('.section-row').remove();
                self.reindexSections();
            });

            $container.on('click', '.add-testimonial-btn', function (e) {
                e.preventDefault();
                const $section = $(this).closest('.section-row');
                self.addTestimonialItem($section);
            });

            $container.on('click', '.remove-testimonial-btn', function (e) {
                e.preventDefault();
                $(this).closest('.testimonial-item').remove();
                self.reindexSections(); // testimonial item indices live inside section data too
            });

            // Per-section collapse/expand toggle.
            $container.on('click', '.section-toggle-btn', function (e) {
                e.preventDefault();
                self.toggleSection($(this).closest('.section-row'));
            });

            // Collapse All / Expand All.
            $('#collapse-all-sections').on('click', function (e) {
                e.preventDefault();
                $('#sections-container > .section-row').each(function () {
                    self.setSectionCollapsed($(this), true);
                });
            });

            $('#expand-all-sections').on('click', function (e) {
                e.preventDefault();
                $('#sections-container > .section-row').each(function () {
                    self.setSectionCollapsed($(this), false);
                });
            });
        },

        /**
         * Collapsing/expanding is purely a UI convenience for making
         * drag-reordering easier on pages with many sections — it never
         * touches form field names/values, so it has no effect on what
         * gets submitted or saved.
         */
        toggleSection: function ($row) {
            const isCollapsed = $row.hasClass('section-collapsed');
            this.setSectionCollapsed($row, !isCollapsed);
        },

        setSectionCollapsed: function ($row, collapsed) {
            const $body = $row.find('.section-row-body');
            const $btn = $row.find('.section-toggle-btn');
            const $icon = $btn.find('.dashicons');

            if (collapsed) {
                $body.slideUp(150);
                $row.addClass('section-collapsed');
                $btn.attr('aria-expanded', 'false');
                $icon.removeClass('dashicons-arrow-up-alt2').addClass('dashicons-arrow-down-alt2');
            } else {
                $body.slideDown(150);
                $row.removeClass('section-collapsed');
                $btn.attr('aria-expanded', 'true');
                $icon.removeClass('dashicons-arrow-down-alt2').addClass('dashicons-arrow-up-alt2');
            }
        },

        sectionFieldTemplates: {
            banner: function (name) {
                return `
                    <p><label>Text</label><br>
                    <input type="text" class="large-text" name="${name}[text]" value="" /></p>
                    <p><label>Link URL</label><br>
                    <input type="url" class="large-text" name="${name}[link_url]" value="" /></p>
                    <p><label>Link Text</label><br>
                    <input type="text" name="${name}[link_text]" value="" /></p>
                    <p>
                        Background: <input type="color" name="${name}[bg_color]" value="#000000" />
                        &nbsp; Text: <input type="color" name="${name}[text_color]" value="#ffffff" />
                    </p>
                `;
            },
            newsletter_signup: function (name) {
                return `
                    <p><label>Title</label><br>
                    <input type="text" class="large-text" name="${name}[title]" value="" /></p>
                    <p><label>Subtitle</label><br>
                    <input type="text" class="large-text" name="${name}[subtitle]" value="" /></p>
                    <p><label>Button Text</label><br>
                    <input type="text" name="${name}[button_text]" value="Subscribe" /></p>
                `;
            },
            category_grid: function (name) {
                return `
                    <p><label>Title</label><br>
                    <input type="text" class="large-text" name="${name}[title]" value="" /></p>
                    <p><label>Categories</label><br>
                    <div class="custom-select-wrapper">
                        <select class="category-select" name="${name}[category_ids][]" multiple="multiple" style="width:100%;" data-placeholder="Type to search categories..."></select>
                    </div></p>
                `;
            },
            testimonials: function (name) {
                return `
                    <p><label>Title</label><br>
                    <input type="text" class="large-text" name="${name}[title]" value="" /></p>
                    <div class="testimonial-items"></div>
                    <button type="button" class="button add-testimonial-btn">+ Add Testimonial</button>
                `;
            }
        },

        sectionLabels: {
            banner: 'Promo Banner',
            newsletter_signup: 'Newsletter Signup',
            category_grid: 'Category Grid',
            testimonials: 'Testimonials'
        },

        addSection: function (type) {
            const template = this.sectionFieldTemplates[type];
            if (!template) return;

            const uid = 'sec_' + Math.random().toString(36).slice(2, 12);
            const label = this.sectionLabels[type] || type;
            // Index is a placeholder — reindexSections() immediately corrects it.
            const idx = '__NEW__';
            const name = `shop_builder_options[home][sections][${idx}][data]`;

            const $row = $(`
                <div class="section-row" data-type="${type}">
                    <input type="hidden" name="shop_builder_options[home][sections][${idx}][id]" value="${uid}" />
                    <input type="hidden" name="shop_builder_options[home][sections][${idx}][type]" value="${type}" />
                    <div class="section-row-header">
                        <span class="section-drag-handle dashicons dashicons-move" title="Drag to reorder"></span>
                        <button type="button" class="section-toggle-btn button-link" aria-expanded="true" title="Collapse/expand this section">
                            <span class="dashicons dashicons-arrow-up-alt2"></span>
                        </button>
                        <strong class="section-title">${label}</strong>
                        <label class="section-enabled-toggle">
                            <input type="checkbox" name="shop_builder_options[home][sections][${idx}][enabled]" value="1" checked />
                            Enabled
                        </label>
                        <button type="button" class="button button-link-delete remove-section-btn">Remove</button>
                    </div>
                    <div class="section-row-body">${template(name)}</div>
                </div>
            `);

            $('#sections-container').append($row);
            $row.find('.category-select').trigger('select2-init-category');
            this.reindexSections();
        },

        addTestimonialItem: function ($section) {
            const $items = $section.find('.testimonial-items');
            const dataAttrIndex = $section.data('index');
            const baseName = `shop_builder_options[home][sections][${dataAttrIndex}][data]`;
            const itemIndex = $items.children('.testimonial-item').length;

            // ✅ FIX: field renamed quote -> review_text (label updated too).
            const $item = $(`
                <div class="testimonial-item" style="border:1px solid #ddd; padding:10px; margin-bottom:8px;">
                    <input type="text" placeholder="Name and Title" name="${baseName}[items][${itemIndex}][name]" value="" />
                    <textarea placeholder="Review Text" rows="2" class="large-text" name="${baseName}[items][${itemIndex}][review_text]"></textarea>
                    <button type="button" class="button button-link-delete remove-testimonial-btn">Remove</button>
                </div>
            `);

            $items.append($item);
        },

        /**
         * Re-derive every input's `name` attribute from the current DOM order,
         * so PHP receives sections[0], sections[1], ... in the order the user
         * actually arranged them (drag/add/remove all call this).
         */
        reindexSections: function () {
            $('#sections-container > .section-row').each(function (sectionIndex) {
                const $row = $(this);
                $row.attr('data-index', sectionIndex);

                $row.find('[name]').each(function () {
                    const $field = $(this);
                    const newName = $field.attr('name').replace(
                        /sections\]\[(?:\d+|__NEW__)\]/,
                        `sections][${sectionIndex}]`
                    );
                    $field.attr('name', newName);
                });

                // Also fix up testimonial item indices within this row so they
                // stay 0,1,2... after an item is removed.
                $row.find('.testimonial-items > .testimonial-item').each(function (itemIndex) {
                    $(this).find('[name]').each(function () {
                        const $field = $(this);
                        const newName = $field.attr('name').replace(
                            /items\]\[\d+\]/,
                            `items][${itemIndex}]`
                        );
                        $field.attr('name', newName);
                    });
                });
            });
        },

        /* -------------------------
           Tab Switching & Preview Link
           ------------------------- */
        bindEvents: function () {
            $(document).on('click', '.nav-tab', function (e) {
                e.preventDefault();
                const target = $(this).data('target');
                $('.nav-tab').removeClass('nav-tab-active');
                $(this).addClass('nav-tab-active');
                $('.tab-content').hide().removeClass('active');
                $('#' + target).show().addClass('active');

                ShopBuilder.updatePreviewLink(target);
            });

            $(document).on('click', '#preview-url-link.disabled', function (e) {
                e.preventDefault();
            });
        },

        // Swaps the "Open Preview" link + displayed URL to match whichever
        // tab is now active. Falls back to a disabled state with a hint
        // when no Frontend Domain is configured yet in Technical Settings.
        updatePreviewLink: function (target) {
            const urls = (shopBuilder && shopBuilder.previewUrls) || {};
            const url = urls[target] || '';
            const $link = $('#preview-url-link');
            const $display = $('#preview-url-display');

            if (url) {
                $display.text(url);
                $link.attr('href', url).removeClass('disabled');
            } else {
                $display.text('Set a Frontend Domain in Technical Settings first.');
                $link.attr('href', '#').addClass('disabled');
            }
        },

        /* -------------------------
           Helpers
           ------------------------- */
        showStatus: function (html, color, autohide, selector) {
            const $status = $(selector || '#sync-status');
            $status.stop(true).show().html(html).css('color', color);
            if (autohide) {
                setTimeout(function () {
                    $status.fadeOut(400, function () { $status.show(); });
                }, autohide);
            }
        },

        /* -------------------------
           Save Draft (shared: used by the form submit AND by "Push to Live",
           which now saves first so a draft save is no longer a required
           separate step before pushing).
           ------------------------- */
        saveDraft: function ( onSuccess, onError ) {
            ShopBuilder.reindexSections();

            const $form = $('.shop-builder-sidebar form');
            const data = $form.serialize()
                + '&action=save_shop_builder_draft'
                + '&nonce=' + shopBuilder.nonce;

            $.post(ajaxurl, data, function (response) {
                if (response.success) {
                    if (typeof onSuccess === 'function') onSuccess(response);
                } else {
                    if (typeof onError === 'function') onError(response.data || 'Unknown error');
                }
            }).fail(function () {
                if (typeof onError === 'function') onError('Connection error. Please try again.');
            });
        },

        /* -------------------------
           Save Draft (AJAX form submit)
           ------------------------- */
        bindFormSubmit: function () {
            let iframeRefreshTimer = null;

            $('.shop-builder-sidebar form').on('submit', function (e) {
                e.preventDefault();

                const $submitBtn = $(this).find('input[type="submit"]');
                const $iframe = $('#shop-preview-frame');

                $submitBtn.prop('disabled', true).val('Saving...');
                ShopBuilder.showStatus('⏳ Saving draft...', '#666', false);

                ShopBuilder.saveDraft(
                    function () {
                        $submitBtn.prop('disabled', false).val('Save Draft');
                        ShopBuilder.showStatus('✅ Draft saved!', 'green', 3000);

                        clearTimeout(iframeRefreshTimer);
                        iframeRefreshTimer = setTimeout(function () {
                            const currentSrc = $iframe.attr('src');
                            $iframe.attr('src', currentSrc);
                        }, 500);
                    },
                    function (error) {
                        $submitBtn.prop('disabled', false).val('Save Draft');
                        ShopBuilder.showStatus('❌ Error: ' + error, 'red', 5000);
                    }
                );
            });
        },

        /* -------------------------
           Push to GitHub / Live
           ------------------------- */
        bindGithubPush: function () {
            $('#push-to-github').on('click', function (e) {
                e.preventDefault();

                if (!confirm('Are you sure you want to push these settings to the LIVE website?')) return;

                const $btn = $(this);
                $btn.prop('disabled', true).text('Saving...');
                ShopBuilder.showStatus('⏳ Saving draft...', '#666', false);

                // Save whatever is currently in the form first — pushing used
                // to only publish whatever was last explicitly saved as a
                // draft, so any edits made since then (including ones on tabs
                // like Contact Button) were silently skipped unless "Save
                // Draft" was clicked first. Now push always publishes the
                // current on-screen state.
                ShopBuilder.saveDraft(
                    function () {
                        $btn.text('Pushing...');
                        ShopBuilder.showStatus('⏳ Syncing with GitHub...', '#666', false);

                        $.ajax({
                            url: ajaxurl,
                            type: 'POST',
                            data: {
                                action: 'push_to_github',
                                nonce: shopBuilder.nonce
                            },
                            success: function (response) {
                                if (response.success) {
                                    const d = response.data;
                                    let html = '✅ Live website updated! ' + d.summary;

                                    if (d.updated_labels && d.updated_labels.length) {
                                        html += '<br><span style="font-weight:400;">Updated: ' + d.updated_labels.join(', ') + '</span>';
                                    }
                                    if (d.skipped_labels && d.skipped_labels.length) {
                                        html += '<br><span style="font-weight:400; color:#666;">No changes: ' + d.skipped_labels.join(', ') + '</span>';
                                    }
                                    if (d.failed_labels && d.failed_labels.length) {
                                        html += '<br><span style="font-weight:400; color:#b32d2e;">Failed: ' + d.failed_labels.join(', ') + '</span>';
                                    }

                                    ShopBuilder.showStatus(html, 'green', 8000);
                                } else {
                                    ShopBuilder.showStatus('❌ Error: ' + (response.data || 'Unknown error'), 'red', 0);
                                }
                            },
                            error: function () {
                                ShopBuilder.showStatus('❌ Connection error. Please try again.', 'red', 0);
                            },
                            complete: function () {
                                $btn.prop('disabled', false).text('Push to Live Website');
                            }
                        });
                    },
                    function (error) {
                        ShopBuilder.showStatus('❌ Could not save draft before pushing: ' + error, 'red', 0);
                        $btn.prop('disabled', false).text('Push to Live Website');
                    }
                );
            });
        },

        /* -------------------------
           Contact Button: add / remove method rows, toggle custom fields
           ------------------------- */
        bindContactMethods: function () {
            let rowSeq = $('.qwoo-contact-method-row').length;

            const placeholders = {
                whatsapp: 'Phone number, no + or spaces (e.g. 15551234567)',
                phone:    'Phone number (e.g. +1 555 123 4567)',
                email:    'name@yourstore.com',
                telegram: '@yourusername',
                custom:   'Full URL (e.g. https://m.me/yourpage)'
            };

            function rowTemplate(index) {
                return '' +
                    '<div class="qwoo-contact-method-row">' +
                        '<div class="qwoo-contact-method-row__top">' +
                            '<select class="qwoo-contact-type" name="shop_builder_options[contact][methods][' + index + '][type]">' +
                                '<option value="whatsapp">WhatsApp</option>' +
                                '<option value="phone">Phone call</option>' +
                                '<option value="email">Email</option>' +
                                '<option value="telegram">Telegram</option>' +
                                '<option value="custom">Custom</option>' +
                            '</select>' +
                            '<label class="qwoo-contact-enabled-label">' +
                                '<input type="checkbox" name="shop_builder_options[contact][methods][' + index + '][enabled]" value="1" /> Enabled' +
                            '</label>' +
                            '<button type="button" class="button button-link-delete qwoo-remove-contact-method">Remove</button>' +
                        '</div>' +
                        '<input type="text" class="large-text qwoo-contact-value" name="shop_builder_options[contact][methods][' + index + '][value]" placeholder="' + placeholders.whatsapp + '" />' +
                        '<div class="qwoo-contact-custom-fields qwoo-hidden">' +
                            '<input type="text" class="large-text" name="shop_builder_options[contact][methods][' + index + '][label]" placeholder="Label (e.g. Live Chat)" />' +
                            '<input type="url" class="large-text" name="shop_builder_options[contact][methods][' + index + '][icon]" placeholder="Icon image URL" />' +
                        '</div>' +
                    '</div>';
            }

            $('#qwoo-add-contact-method').on('click', function () {
                rowSeq += 1;
                $('#qwoo-contact-methods').append(rowTemplate(rowSeq));
            });

            $(document).on('click', '.qwoo-remove-contact-method', function () {
                $(this).closest('.qwoo-contact-method-row').remove();
            });

            $(document).on('change', '.qwoo-contact-type', function () {
                const $row = $(this).closest('.qwoo-contact-method-row');
                const type = $(this).val();

                $row.find('.qwoo-contact-custom-fields').toggleClass('qwoo-hidden', type !== 'custom');
                $row.find('.qwoo-contact-value').attr('placeholder', placeholders[type] || '');
            });
        }
    };

    $(function () {
        ShopBuilder.init();
    });

})(jQuery);