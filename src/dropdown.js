/**
 * Created by liuhui on 15/11/26.
 */
/*
 * 下拉组件
 * options
 *      useClickCoord 使用点击坐标
 *      limitSpace 限制范围
 * 某个事件时，支持弹出下拉菜单
 * 可以为这个下拉菜单指定坐标偏移等css样式
 * 支持远程本地调取数据和远程调取数据
 * 通用功能，支持键盘上下按时，而且当前为显示状态，可以切换
 *     init 构建及初始化
 *     extend 构建一个实例
 *     getExample 创建一个实例
 *     show 显示
 *     hide 隐藏
 *     getData 获取数据（本地或远程）
 *     bindEvent 绑定事件
 *     createDrop 创建下拉菜单
 *     showDrop 显示下拉菜单
 *     goNext 切换到下一个
 *     goPrev 切换到上一个
 *     scrollTo0 滚动到第一个元素
 * */

(function () {
    var DropDown = (function () {
        var uid = 0,
        dropdownAnchorCls = 'jsdropdown',
        dropdownId = 'jsdropdown-lists',
        dropdownItem = 'jsdropdown-list',
        mouseOnCls = 'jsdropdown-item-on',
        focusCls = 'jsdropdown-item-cur';
        return {
            init: function (options) {/*构造*/
                var self = this, uid,
                parent = options.parent || 'body',
                $parent = $(parent),
                $obj = $(options.el);
                this.el = options.el;
                this.parent = parent;
                if (options.lists) this.lists = options.lists;
                $parent.css({
                    position: 'relative'
                });
                $obj.each(function (index, ele) {
                    uid = self.getUid();
                    $(ele).attr('data-id', dropdownId + '-' + uid).addClass(dropdownAnchorCls);
                });
                this.options = options;
                this.bindEvents();
                this.bindDefault();

            },
            getCurrentLi: function () {
                var self = this;
                if (self.$currentLi && self.$currentLi[0]) {

                } else if (self.$drop) {
                    this.$currentLi = self.$drop.find('li:first-child');
                } else {
                    this.$currentLi = null;
                }
                return self.$currentLi;

            },
            bindDefault: function () {/*默认事件*/
                var self = this, events = {}, eventsBody = {},
                options = this.options;
                events['click ' + options.el] = function (e) {
                    self.offsetParentLeft = e.offsetX;
                    self.offsetParentTop = e.offsetY;
                };
                events['click .' + dropdownId + ' li'] = self.evtClickItem;
                events['mouseenter .' + dropdownId + ' li'] = self.evtEnter;
                events['mouseleave .' + dropdownId + ' li'] = self.evtLeave;
                this.delegate(events);

                eventsBody['keydown'] = self.evtBodyDown;
                eventsBody['keyup'] = self.evtBodyUp;
                eventsBody['click'] = function () {
                    self.hide();
                };
                this.delegate(eventsBody, 'body');

            },
            evtBodyDown: function (e) {
                var self = this;
                if (!self.isShow) return;
                if (e.keyCode == 38) {/*向上键*/
                    e.preventDefault();
                    self.goPrev(e);
                } else if (e.keyCode == 40) {/*向下键*/
                    e.preventDefault();
                    self.goNext(e);
                }
            },
            evtBodyUp: function (e) {
                var self = this, options = this.options, obj = e.target,
                val = $(obj).val(),
                isInput = obj.tagName == 'INPUT' ? 1 : 0;
                if (!self.isShow) return;
                self.getCurrentLi();
                if (e.keyCode == 13) {/*回车*/
                    self.$currentLi && options.selectCallback && options.selectCallback.call(self, self.$currentLi);

                }
            },

            evtEnter: function (e) {
                $(e.target).addClass(mouseOnCls);
            },
            evtLeave: function (e) {
                $(e.target).removeClass(mouseOnCls);
            },
            evtClickItem: function (e) {/*每一个点击事件*/
                var self = this, options = this.options,
                $obj = $(e.currentTarget);
                e.stopPropagation();
                if (!self.isShow) return;
                options.selectCallback && options.selectCallback.call(self, $obj);
                self.hide();
            },
            bindEvents: function () {/*由子类去实现*/
                var self = this, events = {},
                options = this.options;
                events['click ' + options.el] = self.evtClick;
                this.delegate(events);
            },

            evtClick: function (e) {/*click event*/
                e.stopPropagation();
                e.preventDefault();
                if (this.isShow) {
                    this.hide();
                    return;
                }

                this.createDrop(e);

            },
            createDrop: function (e) {
                var self = this, $obj = $(e.currentTarget), id;
                id = $obj.attr('data-id');

                self.currentId = id;
                self.$obj = $obj;
                self.getPos(self.$obj);
                this.getData().done(function () {/*获取数据后创建dropdown*/
                    self.insertData(id);
                });
            },
            getData: function () {/*由实例去具体实现*/
                var self = this, deferred = $.Deferred();
                self.lists = self.lists;
                deferred.resolve();
                return deferred.promise();

            },
            insertData: function (id) {/*创建下拉层*/
                var $drop, self = this, str, tpl = self.options.tpl,
                cls = dropdownId + '-' + id,
                options = this.options,
                $parent = $(this.parent);
                $drop = this.$drop;
                this.$currentLi = null;
                if (!$drop) {
                    $drop = $('<ul/>').addClass(cls).addClass(dropdownId).appendTo($parent);
                    if (options.css) $drop.css(options.css);
                    self.$drop = $drop;
                }
                $drop.html();
                $drop.css({
                    left: self.coord.left,
                    top: self.coord.top
                });

                str = $.template(tpl, {lists: self.lists});
                self.$drop.html(str);
                self.$drop.find('li').addClass(dropdownItem);
                if (self.options.selected) self.setCurrent();
                self.show();
            },
            setCurrent: function () {
                this.getCurrentLi();
                this.$currentLi.addClass(focusCls);
                this.scrollToEle();
            },

            getPos: function ($obj) {
                var self = this, $parent = $(this.parent),
                options = this.options,
                offsetParent = $parent.offset(),
                offset = $obj.offset(),
                coord = this.coord || {},
                left = self.offsetParentLeft || 0,
                top = self.offsetParentTop || 0;
                self.$obj = $obj;

                coord.left = offset.left - offsetParent.left + this.options.leftOffset;
                coord.top = offset.top - offsetParent.top + $obj.height() + this.options.topOffset;
                if (options.useClickCoord) {/*使用点击坐标*/
                    coord.left = left + offset.left - offsetParent.left + this.options.leftOffset + 5;
                    coord.top = top + offset.top - offsetParent.top + this.options.topOffset + 5;
                }
                this.coord = coord;
                return coord;
            },
            scrollToEle: function () {
                var top = this.$currentLi[0].offsetTop,
                curTop = this.$drop[0].scrollTop;
                if (!this.scrollMaxTop) {
                    this.scrollMaxTop = this.$drop.height() - this.$currentLi.height();
                }
                if (top > (curTop + this.scrollMaxTop) || top <= curTop) {
                    this.$drop.scrollTop(top);
                }
            },
            goPrev: function () {
                var self = this, $cur,
                $currentli;
                $currentli = this.getCurrentLi();
                $cur = $currentli.prev()[0] ? $currentli.prev() : self.$drop.find('li:last-child');
                $currentli.removeClass(focusCls);
                self.$currentLi = $cur.addClass(focusCls);
                self.scrollToEle();

            },
            goNext: function () {
                var self = this, $cur,
                $currentli;
                if (!self.$currentLi) {
                    self.setCurrent();
                } else {
                    $currentli = this.getCurrentLi();
                    $cur = $currentli.next()[0] ? $currentli.next() : self.$drop.find('li:first-child');
                    $currentli.removeClass(focusCls);
                    self.$currentLi = $cur.addClass(focusCls);
                }

                self.scrollToEle();

            },
            show: function () {
                this.isShow = 1;
                this.$drop && this.$drop.show();
            },
            hide: function (time) {
                var self = this;
                time = time || 0;
                setTimeout(function () {
                    if (!self.$drop) return;
                    self.isShow = 0;
                    self.$drop.html('').hide();
                    delete self.$currentLi;
                }, time);

            },
            delegate: function (events, el) {
                var self = this, arr, func, event, selector,
                $parent = $(this.parent);
                if (el) $parent = $(el);
                for (var i in events) {
                    arr = i.split(" ");
                    func = events[i];
                    event = arr.shift();
                    selector = arr.join(" ");
                    (function (func) {
                        //$parent.off(event, selector);
                        $parent.on(event, selector, function (e) {
                            func && func.call(self, e);
                        })
                    })(func);

                }
            },
            getUid: function () {
                uid++;
                return uid;
            },
            extend: function (obj) {
                var newObject = Object.create(this);
                for (var i in obj) {
                    newObject[i] = obj[i];
                }
                return newObject;
            },
            getExample: function () {
                var obj = Object.create(this);
                obj.init.apply(obj, arguments);
                return obj;
            }
        }
    })();
    $.Dropdown = DropDown;
    var InputDropDown = DropDown.extend({
        bindEvents: function () {
            var self = this, events = {},
            options = this.options;
            events['keydown ' + options.el] = self.evtKeyDown;
            events['keyup ' + options.el] = self.evtKeyUp;
            this.delegate(events);
        },
        evtKeyDown: function (e) {
            var self = this, options = this.options,
            $obj = $(e.currentTarget);
            if (e.keyCode == 8 && !$obj.val()) {/*回退*/
                e.preventDefault();
                options.delCallback && options.delCallback.call(self, $obj);
            }
        },
        evtKeyUp: function (e) {
            var self = this, $obj = $(e.currentTarget),
            options = this.options,
            val = $obj.val();
            e.stopPropagation();
            /*回车并且值没有变化*/
            if (e.keyCode == 13) {
                if (val && val == self.lastWord && !this.lists) {/*input 没有数据，回车输入事件*/
                    e.preventDefault();
                    options.enterCallback && options.enterCallback.call(self, $obj);
                    self.lastWord = val;
                    self.hide();
                } else if (val && val == self.lastWord && this.lists) {
                    self.$currentLi && options.selectCallback && options.selectCallback.call(self, self.$currentLi);
                }

            } else if (e.keyCode != 38 && e.keyCode != 40) {
                if (!val) {
                    self.hide();
                }
                else {
                    self.createDrop(e);
                }

            }

            self.lastWord = val;
        }
    });
    $.InputDropDown = InputDropDown;
    var RightDropDown = DropDown.extend({
        bindEvents: function () {
            var self = this, events = {},
            $parent=$(this.parent),
            dropdownId = 'jsdropdown-lists',
            options = this.options;

            function returnFalse(e) {
                e.stopPropagation();
                return false;
            }
            $parent.on('contextmenu',options.el,returnFalse);
            events['mousedown ' + options.el] = self.evtMouseDown;
            this.delegate(events);
        },
        evtMouseDown: function (e) {
            e.preventDefault();
            e.stopPropagation();
            /*var ie678 = !-[1,];
             if (e.button != 0 && !ie678) return;*/

            if (e.button != 2) return;
            this.createDrop(e);

            return;
        }
    });
    $.RightDropDown = RightDropDown;

})();