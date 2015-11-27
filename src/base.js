/**
 * Created by liuhui on 15/11/25.
 */
(function () {

    window.JSON = window.JSON || {};
    window.JSON.parse = window.JSON.parse || function (data) {
        return (new Function("return (" + data + ")"))();
    };

    if (typeof Object.create != 'function') {
        Object.create = (function () {
            function Temp() {
            }

            var hasOwn = Object.prototype.hasOwnProperty;

            return function (O) {
                if (typeof O != 'object') {
                    throw TypeError('Object prototype may only be an Object or null');
                }

                Temp.prototype = O;
                var obj = new Temp();
                Temp.prototype = null;
                if (arguments.length > 1) {
                    var Properties = Object(arguments[1]);
                    for (var prop in Properties) {
                        if (hasOwn.call(Properties, prop)) {
                            obj[prop] = Properties[prop];
                        }
                    }
                }

                return obj;
            };
        })();
    }
    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function (callback, thisArg) {
            var T, k;
            if (this == null) {
                throw new TypeError(' this is null or not defined');
            }
            var O = Object(this);
            var len = O.length >>> 0;
            if (typeof callback !== "function") {
                throw new TypeError(callback + ' is not a function');
            }
            if (arguments.length > 1) {
                T = thisArg;
            }
            k = 0;
            while (k < len) {
                var kValue;
                if (k in O) {
                    kValue = O[k];
                    callback.call(T, kValue, k, O);//主要就是这段代码
                }
                k++;
            }
        };
    }
    var $ = window.$ || {};
    window.$ = $;
    $.template = function (html, options) {
        var re = /<%([^%>]+)?%>/g, reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g, code = 'var r=[];\n', cursor = 0, match;
        var add = function (line, js) {
            js ? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
            (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
            return add;
        };
        while (match = re.exec(html)) {
            add(html.slice(cursor, match.index))(match[1], true);
            cursor = match.index + match[0].length;
        }
        add(html.substr(cursor, html.length - cursor));
        code += 'return r.join("");';
        return new Function(code.replace(/[\r\t\n]/g, '')).apply(options);
    };
    $.lutils = {
        cloneArr: function (obj) {
            var newArr = [];
            for (var i = 0, l = obj.length; i < l; i++) {
                newArr.push(obj[i]);
            }
            return newArr;
        }
    };
    var AjaxObj = {
        getAjaxObj: function () {
            var xmlHttp;
            var objs = [
                function () {
                    return new XMLHttpRequest();
                },
                function () {
                    return new ActiveXObject("Msxml2.XMLHTTP");
                },
                function () {
                    return new ActiveXObject("Microsoft.XMLHTTP");
                }
            ];
            for (var i = 0; i < objs.length; i++) {
                try {
                    xmlHttp = objs[i]();
                    this.getAjaxObj = objs[i];
                    return xmlHttp;
                } catch (e) {
                    continue;
                }
            }
            alert("您的浏览器不支持AJAX！");

        },
        param: function (obj) {
            var s = [], r20 = /%20/g;
            for (var i in obj) {
                s[s.length] = encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
            }
            return s.join('&').replace(r20, '+');

        },
        request: function (options) {
            var url = options.url, type = options.type,
            self = this, param,
            t = new Date().getTime(),
            xmlhttp, data = options.data || {};
            this.options = options;
            if (!options.cache) data.t = t;
            param = this.param(data);
            if (type == 'GET' && data) url = url + '?' + param;
            xmlhttp = this.getAjaxObj();
            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState == 4) {
                    //HTTP响应已经完全接收才调用
                    if (xmlhttp.status == 200) {
                        var data = JSON.parse(xmlhttp.responseText);
                        self.success(data);
                    }
                    else {
                        console.log('error while receive data');
                    }
                }
            };

            xmlhttp.open(type, url, true);
            xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xmlhttp.responseType = 'text';
            xmlhttp.send(param);

        },
        success: function (data) {
            var func = this.options.success;
            this.data = data;
            func && func.call(this, data);
            return;
        },
        extend: function () {
            return Object.create(this);
        }
    };
    $.lutils.ajax = function () {
        return Object.create(AjaxObj);
    };

    var Doms = {
        getById: function (id) {
            var dom = document.getElementById(id);
            return dom;
        },
        getByClass: function (searchClass, node, tag) {
            node = node || document;
            tag = tag || '*';
            var classes = searchClass.split(" "),
            patterns = "",
            xhtmlNamespace = "http://www.w3.org/1999/xhtml",
            namespaceResolver = (document.documentElement.namespaceURI === xhtmlNamespace) ? xhtmlNamespace : null,
            returnElements = [],
            elements,
            _node;
            for (var j = 0, jl = classes.length; j < jl; j += 1) {
                patterns += "[contains(concat(' ', @class, ' '), ' " + classes[j] + " ')]";
            }
            try {
                elements = document.evaluate(".//" + tag + patterns, node, namespaceResolver, 0, null);
            }
            catch (e) {
                elements = document.evaluate(".//" + tag + patterns, node, null, 0, null);
            }
            while ((_node = elements.iterateNext()))  returnElements.push(_node);
            return returnElements;
        },
        hasClass: function (el, className) {
            if (el.classList)
                return el.classList.contains(className);
            else
                return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))
        },
        addClass: function (el, className) {
            if (el.classList)
                el.classList.add(className)
            else if (!Doms.hasClass(el, className)) el.className += " " + className
        },
        removeClass: function (el, className) {
            if (el.classList)
                el.classList.remove(className)
            else if (Doms.hasClass(el, className)) {
                var reg = new RegExp('(\\s|^)' + className + '(\\s|$)')
                el.className = el.className.replace(reg, ' ')
            }
        },
        getAttr: function (el, name) {
            return el.getAttribute(name);
        },
        setAttr: function (el, name, value) {
            return el.setAttribute(name, value);
        }

    };
    $.ldom = Doms;
})();


