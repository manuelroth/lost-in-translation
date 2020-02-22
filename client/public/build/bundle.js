
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/Legend.svelte generated by Svelte v3.18.2 */

    const file = "src/Legend.svelte";

    // (20:2) {#if errors > 0}
    function create_if_block_1(ctx) {
    	let span1;
    	let span0;
    	let t1;

    	const block = {
    		c: function create() {
    			span1 = element("span");
    			span0 = element("span");
    			span0.textContent = `${/*errors*/ ctx[0]}`;
    			t1 = text("\n      errors");
    			set_style(span0, "font-weight", "bold");
    			add_location(span0, file, 21, 6, 478);
    			attr_dev(span1, "class", "highlight--error svelte-1dhhow7");
    			add_location(span1, file, 20, 4, 440);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span1, anchor);
    			append_dev(span1, span0);
    			append_dev(span1, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(20:2) {#if errors > 0}",
    		ctx
    	});

    	return block;
    }

    // (26:2) {#if warnings > 0}
    function create_if_block(ctx) {
    	let span1;
    	let span0;
    	let t1;

    	const block = {
    		c: function create() {
    			span1 = element("span");
    			span0 = element("span");
    			span0.textContent = `${/*warnings*/ ctx[1]}`;
    			t1 = text("\n      warnings");
    			set_style(span0, "font-weight", "bold");
    			add_location(span0, file, 27, 6, 625);
    			attr_dev(span1, "class", "highlight--warning svelte-1dhhow7");
    			add_location(span1, file, 26, 4, 585);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span1, anchor);
    			append_dev(span1, span0);
    			append_dev(span1, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(26:2) {#if warnings > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let t;
    	let if_block0 = /*errors*/ ctx[0] > 0 && create_if_block_1(ctx);
    	let if_block1 = /*warnings*/ ctx[1] > 0 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "class", "legend");
    			add_location(div, file, 18, 0, 396);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t);
    			if (if_block1) if_block1.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*errors*/ ctx[0] > 0) if_block0.p(ctx, dirty);
    			if (/*warnings*/ ctx[1] > 0) if_block1.p(ctx, dirty);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { rows } = $$props;
    	let errors = rows.filter(row => row.type === "error").length;
    	let warnings = rows.filter(row => row.type === "warning").length;
    	const writable_props = ["rows"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Legend> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("rows" in $$props) $$invalidate(2, rows = $$props.rows);
    	};

    	$$self.$capture_state = () => {
    		return { rows, errors, warnings };
    	};

    	$$self.$inject_state = $$props => {
    		if ("rows" in $$props) $$invalidate(2, rows = $$props.rows);
    		if ("errors" in $$props) $$invalidate(0, errors = $$props.errors);
    		if ("warnings" in $$props) $$invalidate(1, warnings = $$props.warnings);
    	};

    	return [errors, warnings, rows];
    }

    class Legend extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { rows: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Legend",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*rows*/ ctx[2] === undefined && !("rows" in props)) {
    			console.warn("<Legend> was created without expected prop 'rows'");
    		}
    	}

    	get rows() {
    		throw new Error("<Legend>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rows(value) {
    		throw new Error("<Legend>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Header.svelte generated by Svelte v3.18.2 */
    const file$1 = "src/Header.svelte";

    function create_fragment$1(ctx) {
    	let div3;
    	let div0;
    	let t1;
    	let div2;
    	let div1;
    	let t3;
    	let current;

    	const legend = new Legend({
    			props: { rows: /*rows*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			div0.textContent = "Original";
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			div1.textContent = "Translation";
    			t3 = space();
    			create_component(legend.$$.fragment);
    			attr_dev(div0, "class", "left svelte-3l00ca");
    			add_location(div0, file$1, 33, 2, 515);
    			add_location(div1, file$1, 35, 4, 574);
    			attr_dev(div2, "class", "right svelte-3l00ca");
    			add_location(div2, file$1, 34, 2, 550);
    			attr_dev(div3, "class", "header svelte-3l00ca");
    			add_location(div3, file$1, 32, 0, 492);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div2, t3);
    			mount_component(legend, div2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const legend_changes = {};
    			if (dirty & /*rows*/ 1) legend_changes.rows = /*rows*/ ctx[0];
    			legend.$set(legend_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(legend.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(legend.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(legend);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { rows } = $$props;
    	const writable_props = ["rows"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("rows" in $$props) $$invalidate(0, rows = $$props.rows);
    	};

    	$$self.$capture_state = () => {
    		return { rows };
    	};

    	$$self.$inject_state = $$props => {
    		if ("rows" in $$props) $$invalidate(0, rows = $$props.rows);
    	};

    	return [rows];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { rows: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*rows*/ ctx[0] === undefined && !("rows" in props)) {
    			console.warn("<Header> was created without expected prop 'rows'");
    		}
    	}

    	get rows() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rows(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Row.svelte generated by Svelte v3.18.2 */

    const file$2 = "src/Row.svelte";

    // (70:6) {:else}
    function create_else_block(ctx) {
    	let t_value = /*data*/ ctx[0].translation + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*data*/ ctx[0].translation + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(70:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (65:6) {#if data.type}
    function create_if_block$1(ctx) {
    	let div1;
    	let span;
    	let t0_value = /*data*/ ctx[0].translation + "";
    	let t0;
    	let span_class_value;
    	let t1;
    	let div0;
    	let t2_value = /*data*/ ctx[0].description + "";
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");
    			t2 = text(t2_value);
    			attr_dev(span, "class", span_class_value = "highlight--" + /*data*/ ctx[0].type + " svelte-1ux60zr");
    			add_location(span, file$2, 66, 10, 1165);
    			attr_dev(div0, "class", "tooltiptext svelte-1ux60zr");
    			add_location(div0, file$2, 67, 10, 1238);
    			attr_dev(div1, "class", "highlight svelte-1ux60zr");
    			add_location(div1, file$2, 65, 8, 1131);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, span);
    			append_dev(span, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*data*/ ctx[0].translation + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*data*/ 1 && span_class_value !== (span_class_value = "highlight--" + /*data*/ ctx[0].type + " svelte-1ux60zr")) {
    				attr_dev(span, "class", span_class_value);
    			}

    			if (dirty & /*data*/ 1 && t2_value !== (t2_value = /*data*/ ctx[0].description + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(65:6) {#if data.type}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let div2;
    	let div0;
    	let t0_value = /*data*/ ctx[0].original + "";
    	let t0;
    	let t1;
    	let div1;

    	function select_block_type(ctx, dirty) {
    		if (/*data*/ ctx[0].type) return create_if_block$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			if_block.c();
    			attr_dev(div0, "class", "left svelte-1ux60zr");
    			add_location(div0, file$2, 62, 4, 1037);
    			attr_dev(div1, "class", "right svelte-1ux60zr");
    			add_location(div1, file$2, 63, 4, 1081);
    			attr_dev(div2, "class", "row svelte-1ux60zr");
    			add_location(div2, file$2, 61, 2, 1015);
    			add_location(main, file$2, 60, 0, 1006);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			if_block.m(div1, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*data*/ ctx[0].original + "")) set_data_dev(t0, t0_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { data } = $$props;
    	const writable_props = ["data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Row> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => {
    		return { data };
    	};

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	return [data];
    }

    class Row extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Row",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<Row> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var data = [ { rowname:"1",
        doc_id:"1",
        s_id:"1",
        de_art:"Eine Volksinitiative und ein politischer Vorstoss wollen jeden Schweizer und jede Schweizerin zu einem Bürgerdienst zugunsten von Gesellschaft und Umwelt verpflichten.",
        en_art:"A popular initiative and a move in parliament aim to make it as a mandatory law for all Swiss peoples to do a civic duty service that benefits the community and/or the environment.",
        original:"de",
        ff_count:"NA",
        de_sentence_wc:"21",
        en_sentence_wc:"33",
        wc_diff:"-12" },
      { rowname:"2",
        doc_id:"1",
        s_id:"2",
        de_art:"Dieser Bürgerdienst soll das Milizsystem retten und den Pflegenotstand lösen.",
        en_art:"This citizen service system should save the militia system and plug staff shortages in emergency and care sectors.",
        original:"de",
        ff_count:"NA",
        de_sentence_wc:"10",
        en_sentence_wc:"18",
        wc_diff:"-8" },
      { rowname:"3",
        doc_id:"1",
        s_id:"3",
        de_art:"Bloss: Das Vorhaben könnte gegen das Zwangsarbeitsverbot im internationalen Recht verstossen.",
        en_art:"Basically: But the idea may just run counter to international law, which bans forced labour.",
        original:"de",
        ff_count:"NA",
        de_sentence_wc:"11",
        en_sentence_wc:"15",
        wc_diff:"-4" },
      { rowname:"4",
        doc_id:"1",
        s_id:"4",
        de_art:"Ein Schweizer Verein zur Förderung des Milizengagements mit dem Namen \"Service.Citoyen.ch\" will im Jahr 2020 eine Volksinitiative lancieren, die jede Schweizerin und jeden Schweizer zu einem Bürgerdienst verpflichtet.",
        en_art:"A Swiss association for the promotion of militia service with the name of ServiceCitoyen.ch wants to launch a popular initiative in 2020 that would obligate every single Swiss man and woman citizen to perform citizen service.",
        original:"de",
        ff_count:"NA",
        de_sentence_wc:"31",
        en_sentence_wc:"36",
        wc_diff:"-5" },
      { rowname:"5",
        doc_id:"1",
        s_id:"5",
        de_art:"Der Dienst könnte entweder als Militärdienst oder in Form eines gleichwertigen Milizdienstes geleistet werden.",
        en_art:"The service could possibly be done either as military service or in the form of an equivalent service of civic duty.",
        original:"de",
        ff_count:"NA",
        de_sentence_wc:"14",
        en_sentence_wc:"21",
        wc_diff:"-7" },
      { rowname:"6",
        doc_id:"1",
        s_id:"6",
        de_art:"Das Parlament würde bestimmen, inwiefern Ausländer sich – ausserhalb der Armee – freiwillig engagieren dürften.",
        en_art:"The parliament would determine the extent to which foreigners would be allowed to volunteer, as long as it was still outside of the army.",
        original:"de",
        ff_count:"NA",
        de_sentence_wc:"15",
        en_sentence_wc:"24",
        wc_diff:"-9" },
      { rowname:"7",
        doc_id:"1",
        s_id:"7",
        de_art:"Die Initianten wollen damit das Milizengagement aufwerten, zur Bewältigung gegenwärtiger \"kollektiver ökologischer und demografischer Herausforderungen\" beitragen sowie \"Frauen als vollwertige Bürgerinnen anerkennen\".",
        en_art:"In doing so, the initiators hopefully will be able to improve the profile of militia service, which will then contribute to solving contemporary \"collective ecological and demographic challenges\" and in addition to this it would make sure that women would be \"recognized as full and total citizens\". \n",
        original:"de",
        ff_count:"NA",
        de_sentence_wc:"26",
        en_sentence_wc:"48",
        wc_diff:"-22" },
      { rowname:"8",
        doc_id:"1",
        s_id:"8",
        de_art:"In der Schweiz sind bisher nämlich nur Schweizer Männer wehrpflichtig.",
        en_art:"In Switzerland, uno until this point only men with a Swiss passport are currently obliged to serve in the military.",
        original:"de",
        ff_count:"NA",
        de_sentence_wc:"10",
        en_sentence_wc:"20",
        wc_diff:"-10" },
      { rowname:"9",
        doc_id:"1",
        s_id:"9",
        de_art:"Frauen dürfen aktuell auf freiwilliger Basis Militärdienst leisten.",
        en_art:"Women are actually allowed to perform military service on a voluntary basis.",
        original:"de",
        ff_count:"1",
        de_sentence_wc:"8",
        en_sentence_wc:"12",
        wc_diff:"-4" },
      { rowname:"10",
        doc_id:"1",
        s_id:"10",
        de_art:"Mit den \"demografischen Herausforderungen\" ist vor allem der Pflegenotstand gemeint.",
        en_art:"By \"demographic challenges\", the initiators are mainly referring to the crisis in the care sector.",
        original:"de",
        ff_count:"NA",
        de_sentence_wc:"12",
        en_sentence_wc:"15",
        wc_diff:"-3" },
      { rowname:"11",
        doc_id:"1",
        s_id:"11",
        de_art:"\"Das Gesundheitssystem ist mit ernsthaften Kosten- und Personalherausforderungen konfrontiert\", sagt Noémie Roten, Co-Präsidentin von Service Citoyen.",
        en_art:"\"The health system is facing serious cost and staffing problems,\" says Noémie Roten, co-president of the association.",
        original:"de",
        ff_count:"NA",
        de_sentence_wc:"18",
        en_sentence_wc:"19",
        wc_diff:"-1" },
      { rowname:"12",
        doc_id:"1",
        s_id:"12",
        de_art:"Sie verweist auf eine Studie, wonach ein Bürgerdienst die Probleme im Bereich Langzeitpflege abmildern könne.",
        en_art:"She references to a study that suggests civic duty could possibly alleviate these issues in long-term care.",
        original:"de",
        ff_count:"NA",
        de_sentence_wc:"15",
        en_sentence_wc:"18",
        wc_diff:"-3" },
      { rowname:"13",
        doc_id:"2",
        s_id:"1",
        de_art:"Eine Volksinitiative und ein politischer Vorstoss wollen jeden Schweizer und jede Schweizerin zu einem Bürgerdienst zugunsten von Gesellschaft und Umwelt verpflichten.",
        en_art:"A popular initiative and a parliamentary motion want to make it mandatory for all Swiss to do civic duty for the community and environment.",
        original:"de",
        ff_count:"NA",
        de_sentence_wc:"21",
        en_sentence_wc:"24",
        wc_diff:"-3" },
      { rowname:"14",
        doc_id:"2",
        s_id:"2",
        de_art:"Dieser Bürgerdienst soll das Milizsystem retten und den fatalen Pflegenotstand lösen.",
        en_art:"This would save the militia system and fill fatal staff shortages in key sectors.",
        original:"de",
        ff_count:"1",
        de_sentence_wc:"11",
        en_sentence_wc:"14",
        wc_diff:"-3" },
      { rowname:"15",
        doc_id:"2",
        s_id:"3",
        de_art:"Bloss: Das Vorhaben könnte gegen das Zwangsarbeitsverbot im internationalen Recht verstossen.",
        en_art:"The problem is, that international law bans forced labour.",
        original:"de",
        ff_count:"NA",
        de_sentence_wc:"11",
        en_sentence_wc:"9",
        wc_diff:"2" },
      { rowname:"16",
        doc_id:"2",
        s_id:"4",
        de_art:"Ein Schweizer Verein zur Förderung des Milizengagements mit dem Namen \"Service.Citoyen.ch\" will im Jahr 2020 eine Volksinitiative lancieren, die jede Schweizerin und jeden Schweizer zu einem Bürgerdienst verpflichtet.",
        en_art:"ServiceCitoyen.ch, a Swiss association promoting militia service, wants to launch a popular initiative in 2020 that would oblige every Swiss citizen to participate.",
        original:"de",
        ff_count:"NA",
        de_sentence_wc:"31",
        en_sentence_wc:"23",
        wc_diff:"8" },
      { rowname:"17",
        doc_id:"2",
        s_id:"5",
        de_art:"Der Dienst könnte entweder als Militärdienst oder in Form eines gleichwertigen Milizdienstes geleistet werden.",
        en_art:"This could be done either as military service or as an equivalent form of civic duty.",
        original:"de",
        ff_count:"NA",
        de_sentence_wc:"14",
        en_sentence_wc:"16",
        wc_diff:"-2" },
      { rowname:"18",
        doc_id:"2",
        s_id:"6",
        de_art:"Das Parlament würde bestimmen, inwiefern Ausländer sich – ausserhalb der Armee – freiwillig engagieren dürften.",
        en_art:"Parliament would determine how foreigners could volunteer, army service excluded.",
        original:"de",
        ff_count:"NA",
        de_sentence_wc:"15",
        en_sentence_wc:"10",
        wc_diff:"5" },
      { rowname:"19",
        doc_id:"2",
        s_id:"7",
        de_art:"Die Initianten wollen damit das Milizengagement aufwerten, zur Bewältigung gegenwärtiger \"kollektiver ökologischer und demografischer Herausforderungen\" beitragen sowie \"Frauen als vollwertige Bürgerinnen anerkennen\".",
        en_art:"The initiators want to improve the image of militia service, help solve existing \"collective ecological and demographic challenges\" and \"recognise women as full citizens\".",
        original:"de",
        ff_count:"NA",
        de_sentence_wc:"26",
        en_sentence_wc:"24",
        wc_diff:"2" },
      { rowname:"20",
        doc_id:"2",
        s_id:"8",
        de_art:"In der Schweiz sind bisher nämlich nur Schweizer Männer wehrpflichtig.",
        en_art:"In Switzerland, only Swiss men are currently obliged to serve in the military.",
        original:"de",
        ff_count:"NA",
        de_sentence_wc:"10",
        en_sentence_wc:"13",
        wc_diff:"-3" },
      { rowname:"21",
        doc_id:"2",
        s_id:"9",
        de_art:"Konkret dürfen Frauen auf freiwilliger Basis Militärdienst leisten.",
        en_art:"Concrete, women may volunteer.",
        original:"de",
        ff_count:"1",
        de_sentence_wc:"8",
        en_sentence_wc:"4",
        wc_diff:"4" },
      { rowname:"22",
        doc_id:"2",
        s_id:"10",
        de_art:"Mit den \"demografischen Herausforderungen\" ist vor allem der Pflegenotstand gemeint.",
        en_art:"By \"demographic challenges\", the initiators are referring to the crisis in the care sector.",
        original:"de",
        ff_count:"NA",
        de_sentence_wc:"12",
        en_sentence_wc:"14",
        wc_diff:"-2" },
      { rowname:"23",
        doc_id:"2",
        s_id:"11",
        de_art:"\"Das Gesundheitssystem ist mit ernsthaften Kosten- und Personalherausforderungen konfrontiert\", sagt Noémie Roten, Co-Präsidentin von Service Citoyen.",
        en_art:"\"The health system is facing cost and staffing problems,\" says Noémie Roten, co-president of the association. She cites a study that suggests civic duty could alleviate these problems in long-term care.",
        original:"de",
        ff_count:"NA",
        de_sentence_wc:"18",
        en_sentence_wc:"34",
        wc_diff:"-16" },
      { rowname:"24",
        doc_id:"2",
        s_id:"12",
        de_art:"Sie verweist auf eine Studie, wonach ein Bürgerdienst die Probleme im Bereich Langzeitpflege abmildern könne.",
        en_art:"She points to a study that suggests civic duty could alleviate these issues in long-term care.",
        original:"de",
        ff_count:"NA",
        de_sentence_wc:"15",
        en_sentence_wc:"17",
        wc_diff:"-2" } ];

    /* src/App.svelte generated by Svelte v3.18.2 */
    const file$3 = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (52:4) {#each rows as row}
    function create_each_block(ctx) {
    	let current;

    	const row = new Row({
    			props: { data: /*row*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(row.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(row, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(row.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(row.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(row, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(52:4) {#each rows as row}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let t;
    	let div;
    	let current;

    	const header = new Header({
    			props: { rows: /*rows*/ ctx[0] },
    			$$inline: true
    		});

    	let each_value = /*rows*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(header.$$.fragment);
    			t = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "container svelte-as7948");
    			add_location(div, file$3, 50, 2, 1277);
    			add_location(main, file$3, 48, 0, 1248);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t);
    			append_dev(main, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*rows*/ 1) {
    				each_value = /*rows*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getEvaluation(item) {
    	let evaluation = { type: "", description: "" };

    	if (item.wc_diff <= -10 || item.ff_count >= 1) {
    		evaluation.type = "error";

    		if (item.wc_diff <= -10) {
    			evaluation.description = "The translation has readability issues. It considerably differs in length from the original sentence. ";
    		}

    		if (item.ff_count >= 1) {
    			evaluation.description = evaluation.description + "The translation contains an error. Please check the translation for false friends.";
    		}
    	} else if (item.wc_diff <= -4) {
    		evaluation.type = "warning";
    		evaluation.description = "The translation may have readability issues. It differs in length from the original sentence.";
    	}

    	return evaluation;
    }

    function instance$3($$self) {
    	const rows = data.map(item => {
    		const evaluation = getEvaluation(item);

    		return {
    			original: item.de_art,
    			translation: item.en_art,
    			type: evaluation.type,
    			description: evaluation.description
    		};
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return [rows];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
