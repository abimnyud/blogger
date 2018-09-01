/*! Accordion TOC for Blogger V2 <https://dte-project.github.io/blogger/stacked-toc.html> */

/* <https://github.com/tovic/query-string-parser> */
!function(e,n){function t(e,n){function t(e){return decodeURIComponent(e)}function r(e){return void 0!==e}function l(e){return"string"==typeof e}function s(e){return l(e)&&""!==e.trim()?'""'===e||"[]"===e||"{}"===e||'"'===e[0]&&'"'===e.slice(-1)||"["===e[0]&&"]"===e.slice(-1)||"{"===e[0]&&"}"===e.slice(-1):!1}function a(e){if(l(e)){if("true"===e)return!0;if("false"===e)return!1;if("null"===e)return null;if("'"===e.slice(0,1)&&"'"===e.slice(-1))return e.slice(1,-1);if(/^-?(\d*\.)?\d+$/.test(e)&&e>=Number.MIN_SAFE_INTEGER&&e<=Number.MAX_SAFE_INTEGER)return+e;if(s(e))try{return JSON.parse(e)}catch(n){}}return e}function c(e,n,t){for(var r,l=n.split("["),s=0,a=l.length;a-1>s;++s)r=l[s].replace(/\]$/,""),e=e[r]||(e[r]={});e[l[s].replace(/\]$/,"")]=t}var i={},o=e.replace(/^.*?\?/,"");return""===o?i:(o.split(/&(?:amp;)?/).forEach(function(e){var l=e.split("="),s=t(l[0]),o=r(l[1])?t(l[1]):!0;o=!r(n)||n?a(o):o,"]"===s.slice(-1)?c(i,s,o):i[s]=o}),i)}e[n]=t}(window,"q2o");

(function(win, doc) {

    function encode(x) {
        return encodeURIComponent(x);
    }

    function decode(x) {
        return decodeURIComponent(x);
    }

    function is_set(x) {
        return typeof x !== "undefined";
    }

    function is_string(x) {
        return typeof x === "string";
    }

    function is_number(x) {
        return typeof x === "number" || /^-?(\d*\.)?\d+$/.test(x);
    }

    function is_object(x) {
        return x !== null && typeof x === "object";
    }

    function extend(a, b) {
        b = b || {};
        for (var i in a) {
            if (!is_set(b[i])) {
                b[i] = a[i];
            } else if (is_object(a[i]) && is_object(b[i])) {
                b[i] = extend(a[i], b[i]);
            }
        }
        return b;
    }

    function on(el, ev, fn) {
        el.addEventListener(ev, fn, false);
    }

    function on_transition_end(el, fn) {
        var transitions = {
                'transition':'transitionend',
                'OTransition':'otransitionend',
                'MozTransition':'transitionend',
                'WebkitTransition':'webkitTransitionEnd'
            }, i, j;
        for (i in transitions) {
            if (is_set(el.style[i])) {
                j = transitions[i];
                break;
            }
        }
        if (j) {
            on(el, j, function() {
                fn(el);
            });
        } else {
            fn(el);
        }
    }

    function off(el, ev, fn) {
        el.removeEventListener(ev, fn);
    }

    function el(ement, content, attr) {
        ement = doc.createElement(ement);
        if (is_set(content) && content !== "") {
            ement.innerHTML = content;
        }
        if (is_object(attr)) {
            for (var i in attr) {
                if (attr[i] === false) continue;
                ement.setAttribute(i, attr[i]);
            }
        }
        return ement;
    }

    function set_class(el, name) {
        name = name.split(/\s+/);
        var current;
        while (current = name.shift()) el.classList.add(current);
    }

    function reset_class(el, name) {
        name = name.split(/\s+/);
        var current;
        while (current = name.shift()) el.classList.remove(current);
    }

    function get_class(el, name) {
        return el.classList.contains(name);
    }

    function insert(container, el, before) {
        container.insertBefore(el, before);
    }

    function detach(el) {
        el.parentNode && el.parentNode.removeChild(el);
    }

    var script = doc.currentScript || doc.getElementsByTagName('script').pop(),
        headers = {},
        headers_indexes = [],
        panels = {}, clicked,
        infinity = 9999,
        loc = win.location,
        storage = win.localStorage,
        defaults = {
            direction: 'ltr',
            hash: Date.now(),
            url: loc.protocol + '//' + loc.host,
            // id: 0,
            name: 'stacked-toc',
            css: 1,
            sort: 1,
            ad: true,
            toggle: true, // make it possible to collapse all panels
            active: 0,
            container: 0,
            // <https://en.wikipedia.org/wiki/Date_and_time_notation_in_the_United_States>
            date: '%M+ %D, %Y %h:%m %?',
            excerpt: 0,
            image: 0,
            target: 0,
            load: 0,
            recent: 7,
            hide: [],
            text: {
                title: 'Table of Content',
                loading: 'Loading&hellip;',
                midday: ['AM', 'PM'],
                months: [
                    'January',
                    'February',
                    'March',
                    'April',
                    'May',
                    'June',
                    'July',
                    'August',
                    'September',
                    'October',
                    'November',
                    'December'
                ],
                days: [
                    'Sunday',
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday'
                ],
                recent: ' <sup>New!</sup>'
            },
            query: {
                'alt': 'json-in-script',
                'orderby': 'published',
                'max-results': infinity,
                'start-index': 1
            }
        },
        head = doc.head,
        settings = extend(defaults, q2o(script.src));

    function param(o, separator) {
        var s = [], i;
        for (i in o) {
            s.push(encode(i) + '=' + encode(o[i]));
        }
        return '?' + s.join(separator || '&');
    }

    function canon(url, x) {
        url = (url + "").split(/[?&#]/)[0].replace(/\/+$/, "");
        if (is_set(x)) {
            url = url.replace(/\.[\w-]+$/, x ? '.' + x : "");
        }
        return url;
    }

    function blogger(url) {
        // `url` is a blog ID
        if (is_number(url)) {
            return (loc.protocol === 'file:' ? 'https:' : "") + '//www.blogger.com/feeds/' + url + '/posts/summary';
        }
        // `url` is a blog URL
        return canon(url) + '/feeds/posts/summary';
    }

    function load(url, fn, attr) {
        var css = /\.css$/i.test(canon(url)),
            $ = el(css ? 'link' : 'script', "", extend(css ? {
                'href': url,
                'rel': 'stylesheet'
            } : {
                'src': url
            }, attr));
        if ($.readyState) {
            $.onreadystatechange = function() {
                if ($.readyState === "loaded" || $.readyState === "complete") {
                    $.onreadystatechange = null;
                    fn($);
                }
            };
        } else {
            on($, "load", fn);
        }
        insert(head, $, head.firstChild);
        return $;
    }

    var hash = settings.hash,
        url = settings.id || canon(settings.url),
        name = settings.name,
        ad = settings.ad,
        text = settings.text,
        container = el('div', '<h3 class="' + name + '-title">' + text.title + '</h3>', {
            'class': name + ' ' + settings.direction,
            'id': name + ':' + hash
        }),
        loading = el('li', text.loading, {
            'class': name + '-loading'
        });

    if (ad === true) {
        ad = 3;
    }

    // Allow to update settings through current URL query string
    var settings_alt = q2o(loc.search);
    if (is_set(settings_alt[hash])) {
        delete settings_alt[hash].url; // but `url`
        settings = extend(settings, settings_alt[hash]);
    }

    function _show() {
        if (ad !== false) {
            var i = +(storage.getItem(name) || -1);
            if (i > ad) {
                storage.setItem(name, 0);
                return true;
            }
            storage.setItem(name, ++i);
        }
        return false;
    }

    // `2018-08-13T13:07:10.001+07:00`
    function format(s, to) {
        var a = s.split('T'),
            date = a[0].split('-'),
            time = a[1].split('+')[0].split(':'),
            hour = +time[0],
            hour_12 = hour % 12 || 12;
        var symbols = {
            'M\\+': text.months[+date[1] - 1],
            'D\\+': text.days[(new Date(s)).getDay()],
            'h\\+': hour + "",
            'Y': date[0],
            'M': date[1],
            'D': date[2],
            'h': hour_12 + "",
            'm': time[1],
            's': Math.floor(+time[2]) + "",
            '\\?': text.midday[hour_12 < 12 || hour_12 === 24 ? 0 : 1]
        }, i;
        for (i in symbols) {
            to = to.replace(new RegExp('%' + i, 'g'), symbols[i]);
        }
        return to;
    }

    win['_' + hash] = function($) {

        $ = $.feed || {};

        var sort = settings.sort,
            entry = $.entry || [],
            category = $.category || [],
            entry_length = entry.length,
            category_length = category.length, i, j, k;

        if (is_number(sort)) {
            sort = +sort;
            category = category.sort(function(a, b) {
                return a.term.localeCompare(b.term);
            });
            if (sort === -1) {
                category = category.reverse();
            }
        } else if (is_string(sort)) {
            sort = win[sort];
            category = category.sort(sort);
        }

        function down() {
            for (i in panels) {
                if (!panels[i].offsetHeight) continue;
                panels[i].style.height = panels[i].scrollHeight + 'px';
            }
        }

        function click(e) {
            clicked = this;
            var id = clicked.id.split(':')[1],
                term = clicked.innerHTML,
                parent = container.parentNode,
                current = headers[term].parentNode,
                current_panel = panels[term];
            if (settings.toggle === -1) {
                for (i in panels) {
                    if (i === term) continue;
                    !panels[i].offsetHeight && (panels[i].style.height = 0);
                }
            } else {
                for (i in headers) {
                    if (i === term) continue;
                    reset_class(headers[i].parentNode, 'active');
                }
                for (i in panels) {
                    if (i === term) continue;
                    reset_class(panels[i], 'active');
                    panels[i].style.height = 0;
                }
            }
            if (!current_panel.$) {
                set_class(current, 'loading');
                set_class(current_panel, 'loading');
                insert(current_panel, loading);
                current_panel.style.height = current_panel.scrollHeight + 'px';
                set_class(parent, name + '-loading');
                load(blogger(url) + '/-/' + encode(term) + param(extend(settings.query, {
                    'callback': '_' + (hash + 1)
                })), function() {
                    reset_class(parent, name + '-loading');
                    reset_class(current, 'loading');
                    reset_class(current_panel, 'loading');
                    detach(loading);
                    current_panel.style.height = current_panel.scrollHeight + 'px';
                }, {
                    'class': name + '-js',
                    'id': name + '-js:' + id
                });
            }
            if (!get_class(current, 'active')) {
                set_class(current, 'active');
                set_class(current_panel, 'active');
                current_panel.style.height = current_panel.scrollHeight + 'px';
            } else if (settings.toggle) {
                reset_class(current, 'active');
                reset_class(current_panel, 'active');
                current_panel.style.height = 0;
            }
            e.preventDefault();
        }

        var hides = Object.values(settings.hide),
            a, h4, ol;

        for (i = 0; i < category_length; ++i) {
            var term = category[i].term;
            if (hides.indexOf(term) > -1) {
                continue;
            }
            a = el('a', term, {
                'href': canon(settings.url) + '/search/label/' + encode(term),
                'title': term
            });
            h4 = el('h4', "", {
                'class': name + '-header ' + name + '-header:' + i + ' ' + name + '-title',
                'id': name + '-header:' + hash + '.' + i
            });
            ol = el('ol', "", {
                'class': name + '-panel ' + name + '-panel:' + i,
                'id': name + '-panel:' + hash + '.' + i,
                'style': 'overflow:hidden;'
            });
            on_transition_end(ol, function($) {
                $.offsetHeight && ($.style.height = "");
            });
            headers_indexes.push(term);
            headers[term] = a;
            on(a, "touchstart", down);
            on(a, "mousedown", down);
            on(a, "click", click);
            insert(h4, a);
            insert(container, h4);
            insert(container, panels[term] = ol);
        }

    };

    win['_' + (hash + 1)] = function($) {

        $ = $.feed || {};

        var sort = settings.sort,
            term = clicked ? clicked.innerHTML : "",
            entry = $.entry || [],
            entry_length = entry.length,
            ol = panels[term], i, j, k;

        for (i = 0; i < entry_length; ++i) {
            var suffix = i <= settings.recent ? text.recent : "";
            entry[i].$ = !!suffix;
            entry[i].title.$t += suffix;
        }

        if (is_number(sort)) {
            sort = +sort;
            entry = entry.sort(function(a, b) {
                return a.title.$t.localeCompare(b.title.$t);
            });
            if (sort === -1) {
                entry = entry.reverse();
            }
        } else if (is_string(sort)) {
            sort = win[sort];
            entry = entry.sort(sort);
        }

        var target = settings.target,
            size = settings.image,
            excerpt = settings.excerpt,
            state = 'has-title has-url';

        if (settings.date) state += ' has-time';
        if (size) state += ' has-image';
        if (excerpt) state += ' has-excerpt';

        set_class(container, state);

        function list(current) {
            if (!current) return;
            var date = current.published.$t,
                str = "", url;
            for (j = 0, k = current.link.length; j < k; ++j) {
                if (current.link[j].rel === "alternate") {
                    url = current.link[j].href;
                    break;
                }
            }
            if (size) {
                var has_image = 'media$thumbnail' in current,
                    w, h, r;
                if (size === true) size = 80;
                if (is_number(size)) {
                    w = h = size + 'px';
                    size = 's' + size + '-c';
                } else if (r = /^s(\d+)(\-[cp])?$/.exec(size)) {
                    w = r[1] + 'px';
                    h = r[2] ? r[1] + 'px' : 'auto';
                } else if (r = /^w(\d+)\-h(\d+)(\-[cp])?$/.exec(size)) {
                    w = r[1] + 'px';
                    h = r[2] + 'px';
                }
                str += '<p class="' + name + '-image' + (has_image ? "" : ' no-image') + ' loading">';
                var remove = 'this.removeAttribute(\'',
                    remove = ',' + remove + 'onload\'),' + remove + 'onerror\')';
                str += has_image ? '<img class="loading" onload="this.parentNode.classList.remove(\'loading\')' + remove + ';" onerror="this.parentNode.classList.add(\'error\')' + remove + ';" alt="" src="' + current.media$thumbnail.url.replace(/\/s\d+(\-c)?\//g, '/' + size + '/') + '" style="display:block;width:' + w + ';height:' + h + ';">' : '<span class="img" style="display:block;width:' + w + ';height:' + h + ';">';
                str += '</p>';
            }
            str += '<h5 class="' + name + '-title"><a href="' + url + '"' + (target ? ' target="' + target + '"' : "") + '>' + current.title.$t + '</a></h5>';
            if (settings.date) {
                str += '<p class="' + name + '-time"><time datetime="' + date + '">' + format(date, settings.date) + '</time></p>';
            }
            if (excerpt) {
                var summary = current.summary.$t.trim().replace(/<.*?>/g, "").replace(/[<>]/g, ""),
                    has_excerpt = summary.length;
                if (excerpt === true) excerpt = 200;
                str += '<p class="' + name + '-excerpt' + (has_excerpt ? "" : ' no-excerpt') + '">' + summary.slice(0, excerpt) + (has_excerpt > excerpt ? '&hellip;' : "") + '</p>';
            }
            return el('li', str, {
                'class': current.$ ? 'recent' : false
            });
        }

        for (i = 0; i < entry_length; ++i) {
            insert(ol, list(entry[i]));
        }

        if (_show()) {
            win['_' + hash + '_'] = function($) {
                $ = $.feed || {};
                var entry = $.entry || [];
                entry = entry[Math.floor(Math.random() * entry.length)];
                if (entry = list(entry)) {
                    set_class(entry, 'ad');
                    insert(ol, entry, ol.firstChild);
                    if (get_class(ol, 'active')) {
                        ol.style.height = ol.scrollHeight + 'px';
                    }
                }
            };
            load(blogger('298900102869691923') + param(extend(settings.query, {
                'callback': '_' + hash + '_',
                'max-results': 21,
                'orderby': 'updated'
            })) + '&q=' + encode(term.toLowerCase()));
        } else {
            delete win['_' + hash + '_'];
        }

        panels[term].$ = true;

    };

    function fire() {
        var c = settings.container,
            css = settings.css;
        if (css) {
            load(is_string(css) ? css : canon(script.src, 'css'));
        }
        load(blogger(url) + param(extend(settings.query, {
            'callback': '_' + hash,
            'max-results': 0
        })), function() {
            if (c) {
                c = doc.querySelector(c);
                c && (c.innerHTML = ""), insert(c, container);
            } else {
                insert(script.parentNode, container, script);
            }
            reset_class(container.parentNode, name + '-loading');
            var active = settings.active;
            if (is_number(active)) {
                active = headers_indexes[active];
            }
            headers[active] && headers[active].click();
        });
    }

    if (is_number(settings.load)) {
        win.setTimeout(fire, +settings.load);
    } else if (settings.load === true) {
        on(win, "load", fire);
    } else {
        fire();
    }

})(window, document);