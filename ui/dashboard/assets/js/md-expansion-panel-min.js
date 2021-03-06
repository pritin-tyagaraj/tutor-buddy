/* eslint-disable */ ! function() {
    "use strict";
    angular.module("material.components.expansionPanels", ["material.core"])
}(),
function() {
    "use strict";
    angular.module("material.components.expansionPanels").run(["$templateCache", function(n) {
        n.put("icons/ic_keyboard_arrow_right_black_24px.svg",
            '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">\n    <path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z"/>\n    <path d="M0-.25h24v24H0z" fill="none"/>\n</svg>'
        )
    }])
}(),
function() {
    "use strict";

    function n() {
        function n(n, e) {
            var o = "Invalid HTML for md-expansion-panel: ";
            if (n.attr("tabindex", e.tabindex || "0"), null === n[0].querySelector("md-expansion-panel-collapsed")) throw Error(o + "Expected a child element of `md-epxansion-panel-collapsed`");
            if (null === n[0].querySelector("md-expansion-panel-expanded")) throw Error(o + "Expected a child element of `md-epxansion-panel-expanded`");
            return function(n, e, o, t) {
                var i = t[0],
                    r = t[1];
                i.epxansionPanelGroupCtrl = r || void 0, i.init()
            }
        }

        function o(n, o, t, i, r, a, s, l, c, d, u, p) {
            function m(n) {
                var e = a.KEY_CODE;
                switch (n.keyCode) {
                    case e.ENTER:
                        g();
                        break;
                    case e.ESCAPE:
                        x()
                }
            }

            function f() {
                F = !0, M === !0 && v()
            }

            function v() {
                return F === !1 ? void(M = !0) : ("function" == typeof q && (q(), q = void 0), D.componentId && D.epxansionPanelGroupCtrl && D.epxansionPanelGroupCtrl.removePanel(D.componentId), void 0 === t.mdComponentId && t.$set(
                    "mdComponentId", "_expansion_panel_id_" + s.nextUid()), D.componentId = t.mdComponentId, q = l.register({
                    expand: g,
                    collapse: x,
                    remove: C,
                    onRemove: $,
                    isOpen: h,
                    addClickCatcher: S,
                    removeClickCatcher: _,
                    componentId: t.mdComponentId
                }, t.mdComponentId), void(D.epxansionPanelGroupCtrl && D.epxansionPanelGroupCtrl.addPanel(D.componentId, {
                    expand: g,
                    collapse: x,
                    remove: C,
                    onRemove: $,
                    destroy: E,
                    isOpen: h
                })))
            }

            function h() {
                return W
            }

            function g(n) {
                if (W !== !0 && L !== !0) {
                    W = !0, n = n || {};
                    var t = d.defer();
                    return D.epxansionPanelGroupCtrl && D.epxansionPanelGroupCtrl.expandPanel(D.componentId), o.removeClass("md-close"), o.addClass("md-open"), n.animation === !1 ? o.addClass("md-no-animation") : o.removeClass(
                        "md-no-animation"), w(), O.hide(n), G.show(n), j && j.show(n), N && N.show(n), c(function() {
                        t.resolve()
                    }, n.animation === !1 ? 0 : e), t.promise
                }
            }

            function x(n) {
                if (W !== !1) {
                    W = !1, n = n || {};
                    var t = d.defer();
                    return o.addClass("md-close"), o.removeClass("md-open"), n.animation === !1 ? o.addClass("md-no-animation") : o.removeClass("md-no-animation"), P(), O.show(n), G.hide(n), j && j.hide(n), N && N.hide(n), c(function() {
                        t.resolve()
                    }, n.animation === !1 ? 0 : e), t.promise
                }
            }

            function C(t) {
                t = t || {};
                var i = d.defer();
                return D.epxansionPanelGroupCtrl && D.epxansionPanelGroupCtrl.removePanel(D.componentId), "function" == typeof q && (q(), q = void 0), t.animation === !1 || W === !1 ? (n.$destroy(), o.remove(), i.resolve(), y()) : (x(), c(
                    function() {
                        n.$destroy(), o.remove(), i.resolve(), y()
                    }, e)), i.promise
            }

            function $(n) {
                B = n
            }

            function y() {
                "function" == typeof B && (B(), B = void 0)
            }

            function E() {
                n.$destroy()
            }

            function w() {
                (N && N.noSticky !== !0 || j && j.noSticky !== !0) && (H = n.$watch(function() {
                    return o[0].offsetTop
                }, K, !0), z = n.$watch(function() {
                    return o[0].offsetWidth
                }, Y, !0), A = s.getNearestContentElement(o), "MD-CONTENT" === A.nodeName ? (U = k(A), angular.element(A).on("scroll", K)) : U = void 0, G.setHeight === !0 && G.$element.on("scroll", K), angular.element(i).on("scroll",
                    K).on("resize", K).on("resize", Y))
            }

            function P() {
                "function" == typeof H && (H(), H = void 0), "function" == typeof z && (z(), z = void 0), A && "MD-CONTENT" === A.nodeName && angular.element(A).off("scroll", K), G.setHeight === !0 && G.$element.off("scroll", K), angular.element(
                    i).off("scroll", K).off("resize", K).off("resize", Y)
            }

            function k(n) {
                for (var e = n.parentNode; e && e !== document;) {
                    if (b(e, "transform")) return e;
                    e = e.parentNode
                }
            }

            function b(n, e) {
                var o = !1;
                if (n) {
                    var t = i.getComputedStyle(n);
                    o = void 0 !== t[e] && "none" !== t[e]
                }
                return o
            }

            function I(n) {
                var e, o, t;
                t = G.setHeight === !0 ? G.$element[0].getBoundingClientRect() : A.getBoundingClientRect();
                var i = U ? U.getBoundingClientRect().top : 0;
                e = Math.max(t.top, 0), o = e + t.height, N && N.noSticky === !1 && N.onScroll(e, o, i), j && j.noSticky === !1 && j.onScroll(e, o, i)
            }

            function R() {
                var n = o[0].offsetWidth;
                N && N.noSticky === !1 && N.onResize(n), j && j.noSticky === !1 && j.onResize(n)
            }

            function S(e) {
                T = s.createBackdrop(n), T[0].tabIndex = -1, "function" == typeof e && T.on("click", e), u.enter(T, o.parent(), null, {
                    duration: 0
                }), o.css("z-index", 60)
            }

            function _() {
                T && (T.remove(), T.off("click"), T = void 0, o.css("z-index", ""))
            }
            var O, G, j, N, q, A, H, z, B, U, T, D = this,
                F = !1,
                M = !1,
                W = !1,
                L = !1,
                K = r.throttle(I),
                Y = r.throttle(R);
            D.registerCollapsed = function(n) {
                O = n
            }, D.registerExpanded = function(n) {
                G = n
            }, D.registerHeader = function(n) {
                j = n
            }, D.registerFooter = function(n) {
                N = n
            }, void 0 === t.mdComponentId ? (t.$set("mdComponentId", "_expansion_panel_id_" + s.nextUid()), v()) : t.$observe("mdComponentId", function() {
                v()
            }), D.$element = o, D.expand = g, D.collapse = x, D.remove = C, D.destroy = E, D.onRemove = $, D.init = f, void 0 !== t.ngDisabled ? n.$watch(t.ngDisabled, function(n) {
                L = n, o.attr("tabindex", L ? -1 : 0)
            }) : void 0 !== t.disabled && (L = void 0 !== t.disabled && "false" !== t.disabled && t.disabled !== !1, o.attr("tabindex", L ? -1 : 0)), o.on("focus", function(n) {
                o.on("keydown", m)
            }).on("blur", function(n) {
                o.off("keydown", m)
            }), n.$panel = {
                collapse: x,
                expand: g,
                remove: C,
                isOpen: h
            }, n.$on("$destroy", function() {
                _(), "function" == typeof q && (q(), q = void 0), P()
            })
        }
        var t = {
            restrict: "E",
            require: ["mdExpansionPanel", "?^^mdExpansionPanelGroup"],
            scope: !0,
            compile: n,
            controller: ["$scope", "$element", "$attrs", "$window", "$$rAF", "$mdConstant", "$mdUtil", "$mdComponentRegistry", "$timeout", "$q", "$animate", "$parse", o]
        };
        return t
    }
    angular.module("material.components.expansionPanels").directive("mdExpansionPanel", n);
    var e = 180
}(),
function() {
    "use strict";

    function n(n, e, o) {
        function t(t) {
            var i = n.get(t);
            return i ? i : void o.error(e.supplant(r, [t || ""]))
        }

        function i(e) {
            return n.when(e)["catch"](o.error)
        }
        var r = "ExpansionPanel '{0}' is not available! Did you use md-component-id='{0}'?",
            a = {
                find: t,
                waitFor: i
            };
        return function(n) {
            return void 0 === n ? a : t(n)
        }
    }
    angular.module("material.components.expansionPanels").factory("$mdExpansionPanel", n), n.$inject = ["$mdComponentRegistry", "$mdUtil", "$log"]
}(),
function() {
    "use strict";

    function n(n, e) {
        function o(o, t, i, r) {
            function a(e) {
                t.css("width", t[0].offsetWidth + "px"), r.$element.css("min-height", t[0].offsetHeight + "px");
                var o = {
                    addClass: "md-absolute md-hide",
                    from: {
                        opacity: 1
                    },
                    to: {
                        opacity: 0
                    }
                };
                e.animation === !1 && (o.duration = 0), n(t, o).start().then(function() {
                    t.removeClass("md-hide"), t.css("display", "none")
                })
            }

            function s(o) {
                t.css("display", ""), t.css("width", t[0].parentNode.offsetWidth + "px");
                var i = {
                    addClass: "md-show",
                    from: {
                        opacity: 0
                    },
                    to: {
                        opacity: 1
                    }
                };
                o.animation === !1 && (i.duration = 0), n(t, i).start().then(function() {
                    r.$element.css("transition", "none"), t.removeClass("md-absolute md-show"), t.css("width", ""), r.$element.css("min-height", ""), e(function() {
                        r.$element.css("transition", "")
                    }, 0)
                })
            }
            r.registerCollapsed({
                show: s,
                hide: a
            }), t.on("click", function() {
                r.expand()
            })
        }
        var t = {
            restrict: "E",
            require: "^^mdExpansionPanel",
            link: o
        };
        return t
    }
    angular.module("material.components.expansionPanels").directive("mdExpansionPanelCollapsed", n), n.$inject = ["$animateCss", "$timeout"]
}(),
function() {
    "use strict";

    function n(n, e) {
        function o(o, t, i, r) {
            function a(e) {
                var o = l ? l : t[0].scrollHeight + "px";
                t.addClass("md-hide md-overflow"), t.removeClass("md-show md-scroll-y");
                var i = {
                    from: {
                        "max-height": o,
                        opacity: 1
                    },
                    to: {
                        "max-height": "48px",
                        opacity: 0
                    }
                };
                e.animation === !1 && (i.duration = 0), n(t, i).start().then(function() {
                    t.css("display", "none"), t.removeClass("md-hide")
                })
            }

            function s(o) {
                t.css("display", ""), t.addClass("md-show md-overflow");
                var i = l ? l : t[0].scrollHeight + "px",
                    r = {
                        from: {
                            "max-height": "48px",
                            opacity: 0
                        },
                        to: {
                            "max-height": i,
                            opacity: 1
                        }
                    };
                o.animation === !1 && (r.duration = 0), n(t, r).start().then(function() {
                    void 0 !== l ? t.addClass("md-scroll-y") : (t.css("transition", "none"), t.css("max-height", "none"), e(function() {
                        t.css("transition", "")
                    }, 0)), t.removeClass("md-overflow")
                })
            }
            var l = i.height || void 0;
            void 0 !== l && (l = l.replace("px", "") + "px"), r.registerExpanded({
                show: s,
                hide: a,
                setHeight: void 0 !== l,
                $element: t
            })
        }
        var t = {
            restrict: "E",
            require: "^^mdExpansionPanel",
            link: o
        };
        return t
    }
    angular.module("material.components.expansionPanels").directive("mdExpansionPanelExpanded", n), n.$inject = ["$animateCss", "$timeout"]
}(),
function() {
    "use strict";

    function n() {
        function n(n, e, o, t) {
            function i() {}

            function r() {
                l()
            }

            function a(n, o, i) {
                var r, a, s = e[0].getBoundingClientRect();
                s.bottom > o ? (r = u[0].offsetHeight, a = o - r - i, a < e[0].parentNode.getBoundingClientRect().top && (a = e[0].parentNode.getBoundingClientRect().top), u.css("width", t.$element[0].offsetWidth + "px"), e.css("height", r +
                    "px"), u.css("top", a + "px"), e.addClass("md-stick"), c = !0) : c === !0 && l()
            }

            function s(n) {
                c !== !1 && u.css("width", n + "px")
            }

            function l() {
                c = !1, u.css("width", ""), u.css("top", ""), e.css("height", ""), e.removeClass("md-stick")
            }
            var c = !1,
                d = void 0 !== o.mdNoSticky,
                u = angular.element(e[0].querySelector(".md-expansion-panel-footer-container"));
            t.registerFooter({
                show: i,
                hide: r,
                onScroll: a,
                onResize: s,
                noSticky: d
            })
        }
        var e = {
            restrict: "E",
            transclude: !0,
            template: '<div class="md-expansion-panel-footer-container" ng-transclude></div>',
            require: "^^mdExpansionPanel",
            link: n
        };
        return e
    }
    angular.module("material.components.expansionPanels").directive("mdExpansionPanelFooter", n)
}(),
function() {
    "use strict";

    function n() {
        function n(n, e, o, t) {
            function i(n) {
                return E.push(n),
                    function() {
                        E.splice(E.indexOf(n), 1)
                    }
            }

            function r() {
                var n = u();
                E.forEach(function(e) {
                    e(n)
                })
            }

            function a(n, e) {
                y[n] = e, P === !0 && (e.expand(), p(n)), r()
            }

            function s(n) {
                p(n)
            }

            function l(n, e) {
                return y[n].remove(e)
            }

            function c(n) {
                Object.keys(y).forEach(function(e) {
                    y[e].remove(n)
                })
            }

            function d(n) {
                delete y[n], r()
            }

            function u() {
                return Object.keys(y).length
            }

            function p(n) {
                w === !1 && Object.keys(y).forEach(function(e) {
                    e !== n && y[e].collapse()
                })
            }

            function m(n, e) {
                if (void 0 !== $[n]) throw Error('$mdExpansionPanelGroup.register() The name "' + n + '" has already been registered');
                $[n] = e
            }

            function f(n) {
                if (void 0 === $[n]) throw Error('$mdExpansionPanelGroup.addPanel() Cannot find Panel with name of "' + n + '"');
                return $[n]
            }

            function v() {
                return Object.keys(y).map(function(n) {
                    return y[n]
                })
            }

            function h() {
                return Object.keys(y).map(function(n) {
                    return y[n]
                }).filter(function(n) {
                    return n.isOpen()
                })
            }

            function g(n) {
                var e = n !== !0;
                Object.keys(y).forEach(function(n) {
                    y[n].collapse({
                        animation: e
                    })
                })
            }
            var x, C = this,
                $ = {},
                y = {},
                E = [],
                w = void 0 !== e.mdMultiple || void 0 !== e.multiple,
                P = void 0 !== e.mdAutoExpand || void 0 !== e.autoExpand;
            x = t.register({
                $element: o,
                register: m,
                getRegistered: f,
                getAll: v,
                getOpen: h,
                remove: l,
                removeAll: c,
                collapseAll: g,
                onChange: i,
                count: u
            }, e.mdComponentId), C.addPanel = a, C.expandPanel = s, C.removePanel = d, n.$on("$destroy", function() {
                "function" == typeof x && (x(), x = void 0), Object.keys(y).forEach(function(n) {
                    y[n].destroy()
                })
            })
        }
        var e = {
            restrict: "E",
            controller: ["$scope", "$attrs", "$element", "$mdComponentRegistry", n]
        };
        return e
    }
    angular.module("material.components.expansionPanels").directive("mdExpansionPanelGroup", n)
}(),
function() {
    "use strict";

    function n(n, e, o, t, i, r, a, s, l) {
        function c(o) {
            var t = n.get(o);
            return t ? u(t) : void l.error(e.supplant(p, [o || ""]))
        }

        function d(e) {
            var o = s.defer();
            return n.when(e).then(function(n) {
                o.resolve(u(n))
            })["catch"](function(n) {
                o.reject(), l.error(n)
            }), o.promise
        }

        function u(n) {
            function l(e, o) {
                if ("string" != typeof e) throw Error("$mdExpansionPanelGroup.register() Expects name to be a string");
                g(o), n.register(e, o)
            }

            function c(e, o) {
                return n.remove(e, o)
            }

            function d(e) {
                n.removeAll(e)
            }

            function u(e) {
                return n.onChange(e)
            }

            function p() {
                return n.count()
            }

            function m() {
                return n.getAll()
            }

            function f() {
                return n.getOpen()
            }

            function v(e) {
                n.collapseAll(e)
            }

            function h(t, l) {
                if (l = l || {}, "string" == typeof t) return h(n.getRegistered(t), l);
                if (g(t), t.componentId && n.isPanelActive(t.componentId)) return s.reject('panel with componentId "' + t.componentId + '" is currently active');
                var c = s.defer(),
                    d = i.$new();
                return angular.extend(d, t.scope), x(t, function(i) {
                    var s = angular.element(i),
                        u = t.componentId || s.attr("md-component-id") || "_panelComponentId_" + e.nextUid(),
                        p = o().waitFor(u);
                    s.attr("md-component-id", u);
                    var m = r(s);
                    if (t.controller) {
                        angular.extend(l, t.locals || {}), l.$scope = d, l.$panel = p;
                        var f = a(t.controller, l, !0),
                            v = f();
                        s.data("$ngControllerController", v), s.children().data("$ngControllerController", v), t.controllerAs && (d[t.controllerAs] = v)
                    }
                    n.$element.append(s), m(d), p.then(function(n) {
                        c.resolve(n)
                    })
                }), c.promise
            }

            function g(n) {
                if ("object" != typeof n || null === n) throw Error("$mdExapnsionPanelGroup.add()/.register() : Requires an options object to be passed in");
                if (!n.template && !n.templateUrl) throw Error("$mdExapnsionPanelGroup.add()/.register() : Is missing required paramters to create. Required One of the following: template, templateUrl")
            }

            function x(n, e) {
                void 0 !== n.templateUrl ? t(n.templateUrl).then(function(n) {
                    e(n)
                }) : e(n.template)
            }
            var C = {
                add: h,
                register: l,
                getAll: m,
                getOpen: f,
                remove: c,
                removeAll: d,
                collapseAll: v,
                onChange: u,
                count: p
            };
            return C
        }
        var p = "ExpansionPanelGroup '{0}' is not available! Did you use md-component-id='{0}'?",
            m = {
                find: c,
                waitFor: d
            };
        return function(n) {
            return void 0 === n ? m : c(n)
        }
    }
    angular.module("material.components.expansionPanels").factory("$mdExpansionPanelGroup", n), n.$inject = ["$mdComponentRegistry", "$mdUtil", "$mdExpansionPanel", "$templateRequest", "$rootScope", "$compile", "$controller", "$q", "$log"]
}(),
function() {
    "use strict";

    function n() {
        function n(n, e, o, t) {
            function i() {}

            function r() {
                l()
            }

            function a(n, o, t) {
                var i, r, a = e[0].getBoundingClientRect();
                a.top < n ? (i = n - t, r = e[0].parentNode.getBoundingClientRect().bottom - n - a.height, r < 0 && (i += r), u.css("width", e[0].offsetWidth + "px"), u.css("top", i + "px"), e.css("height", u[0].offsetHeight + "px"), e.removeClass(
                    "md-no-stick"), e.addClass("md-stick"), c = !0) : c === !0 && l()
            }

            function s(n) {
                c !== !1 && u.css("width", n + "px")
            }

            function l() {
                c = !1, u.css("width", ""), e.css("height", ""), e.css("top", ""), e.removeClass("md-stick"), e.addClass("md-no-stick")
            }
            var c = !1,
                d = void 0 !== o.mdNoSticky,
                u = angular.element(e[0].querySelector(".md-expansion-panel-header-container"));
            t.registerHeader({
                show: i,
                hide: r,
                noSticky: d,
                onScroll: a,
                onResize: s
            })
        }
        var e = {
            restrict: "E",
            transclude: !0,
            template: '<div class="md-expansion-panel-header-container" ng-transclude></div>',
            require: "^^mdExpansionPanel",
            link: n
        };
        return e
    }
    angular.module("material.components.expansionPanels").directive("mdExpansionPanelHeader", n), n.$inject = []
}(),
function() {
    "use strict";

    function n() {
        var n = {
            restrict: "E",
            template: '<md-icon class="md-expansion-panel-icon" md-svg-icon="icons/ic_keyboard_arrow_right_black_24px.svg"></md-icon>',
            replace: !0
        };
        return n
    }
    angular.module("material.components.expansionPanels").directive("mdExpansionPanelIcon", n)
}();
/* eslint-enable */