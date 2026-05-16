`<<modelprepare-player-clothes>>`
DefineMacro("modelprepare-player-clothes", function () {
	T.modeloptions.breasts =
		!V.worn.upper.type.includes("naked") || !V.worn.under_upper.type.includes("naked") || T.coverBreastsWithArm ? "cleavage" : "default";

	if (V.worn.under_upper.type.includes("chest_bind")) {
		T.modeloptions.breast_size = 1;
	}

	if (V.worn.lower.exposed >= 2 && V.worn.under_lower.exposed >= 1 && !V.worn.legs.name.includes("tights")) {
		T.modeloptions.crotch_visible = true;
		T.modeloptions.crotch_exposed = true;
	} else if ((V.lowerwetstage > 0 || V.worn.lower.type.includes("naked")) && (V.underlowerwetstage > 0 || V.worn.under_lower.type.includes("naked"))) {
		T.modeloptions.crotch_visible = true;
		T.modeloptions.crotch_exposed = false;
	} else {
		T.modeloptions.crotch_visible = false;
	}

	T.modeloptions.hood_down = V.worn.upper.hoodposition === "down";

	if (
		((V.worn.over_head.hood === 1 && V.worn.over_head.mask_img !== 1) || (V.worn.head.hood === 1 && V.worn.head.mask_img !== 1)) &&
		V.worn.upper.hoodposition === "down"
	) {
		T.modeloptions.hair_sides_length = "short";
		T.modeloptions.hair_fringe_length = "short";
	}

	T.modeloptions.facewear_layer = V.facelayer;
	T.modeloptions.upper_tucked = V.upperTucked && !setup.clothes.upper[clothesIndex("upper", V.worn.upper)].notuck && V.worn.upper.outfitPrimary === undefined;
	T.modeloptions.lower_tucked = !V.worn.feet.notuck && !V.worn.lower.notuck && V.lowerTucked;
	T.modeloptions.belly_tucked =
		V.bellyTucked === 1 &&
		V.player.bodyshape === "soft" &&
		V.worn.lower.name !== "naked" &&
		(!setup.clothes.lower[clothesIndex("lower", V.worn.lower)].outfitSecondary ||
			setup.clothes.lower[clothesIndex("lower", V.worn.lower)]?.outfitSecondary[1] !== V.worn.upper.name);

	Object.assign(T.modeloptions, getClothingOptions());
	const overrides = V.modeloptionsOverride;
	if (Object.keys(overrides).length > 0) {
		for (const [key, value] of Object.entries(overrides)) {
			T.modeloptions[key] = value;
		}
	}
});

function getClothingOptions() {
	const modelOptions = { worn: {}, filters: {} };
	const slots = [
		["upper", V.upperwetstage],
		["over_upper"],
		["genitals"],
		["lower", V.lowerwetstage],
		["over_lower"],
		["under_lower", V.underlowerwetstage],
		["under_upper", V.underupperwetstage],
		["hands"],
		["handheld"],
		["head"],
		["over_head"],
		["face"],
		["neck"],
		["legs"],
		["feet"],
	];

	for (const slotobj of slots) {
		const item = V.worn[slotobj[0]];
		modelOptions.worn = { ...modelOptions.worn, ...getClothingOptionsItem(slotobj[0], item, slotobj[1]) };

		if (item.accessory_layer_under) {
			modelOptions.acc_layer_under = item.accessory_layer_under;
		}
		if (item.colour === "custom") {
			/* TODO @aimozg We recalculate custom colour RGB here; in future versions, we should store custom colours in canvasfilter-friendly way */
			modelOptions.filters["worn_" + slotobj[0] + "_custom"] = item.colourCanvasFilter || getCustomClothesColourCanvasFilter(item.colourCustom);
		}
		if (item.accessory_colour === "custom") {
			modelOptions.filters["worn_" + slotobj[0] + "_acc_custom"] =
				item.accessory_colourCanvasFilter || getCustomClothesColourCanvasFilter(item.accessory_colourCustom);
		}
	}
	return modelOptions;
}

function getClothingOptionsItem(slot, item, stage) {
	const itemOptions = {};

	const index = clothesIndex(slot, item);
	itemOptions[slot] = {
		index,
		setup: setup.clothes[slot][index],
		integrity: integrityKeyword(item, slot),
		colour: item.colour,
		alt: item.altposition,
		pattern: item.pattern,
		pattern_layer: item.pattern_layer,
	};
	itemOptions[slot].alpha = { 1: 0.9, 2: 0.7, 3: 0.5 }[stage] ?? 1.0;
	itemOptions[slot].accColour = item.accessory_colour;
	return itemOptions;
}

window.getCustomClothesColourCanvasFilter = function (hue, saturation, brightness, contrast, sepia = 0) {
	if (arguments.length === 1 && typeof arguments[0] === "string") {
		const match = parseCSSFilter(arguments[0]);
		if (!match) return clone(setup.colours.clothes_default);
		hue = +match[1];
		saturation = +match[2];
		brightness = +match[3];
		contrast = +match[4];
		sepia = +match[5];
	}
	let filterBrightness = 0.0;
	if (brightness >= 1.0) {
		// Slider brightness is 0..4, we consider 0..1 for colour spec
		// and everything above as extra brightness adjustment
		// In new renderer it's a shift, not multiplier, so we scale it from x1..x4 to +0..+0.21
		filterBrightness += Math.max(0, (brightness - 1) * 0.07 - (1 - saturation) * 0.21);
	}
	return Renderer.mergeLayerData(
		{
			blend: tinycolor(getCustomColourRGB(hue, saturation, brightness, contrast, sepia)).toHexString(),
			contrast,
			brightness: filterBrightness,
		},
		setup.colours.clothes_default
	);
};

function clothesIndex(slot, itemToIndex) {
	if (!slot || !itemToIndex || !itemToIndex.name || !itemToIndex.variable) {
		/* console.log(`clothesIndex - slot or valid object not provided`); */
		Errors.report(`[clothesIndex]: slot or valid object not provided`, {
			Stacktrace: Utils.GetStack(),
			slot,
			itemToIndex,
		});
		return 0;
	}
	const index = setup.clothes[slot].findIndex(item => item.variable === itemToIndex.variable && item.modder === itemToIndex.modder);
	if (index === -1) {
		console.log(`clothesIndex - ${slot} clothing item index not found for the '${itemToIndex.name}' with the modder set to '${itemToIndex.modder}'`);
		/* try and correct .modder mismatches */
		let oldVariable = false;
		let matches = setup.clothes[slot].filter(item => item.variable === itemToIndex.variable);
		if (matches.length === 0) {
			/* try to find and item that had its variable changed */
			matches = setup.clothes[slot].filter(
				item =>
					Array.isArray(item.oldVariable) &&
					item.oldVariable.find(oldVariableItem => oldVariableItem.name === itemToIndex.name && oldVariableItem.variable === itemToIndex.variable)
			);
			oldVariable = true;
		}
		if (matches.length === 1) {
			const recovery = matches[0];
			itemToIndex.index = recovery.index;
			itemToIndex.modder = recovery.modder;
			if (oldVariable) {
				itemToIndex.name = recovery.name;
				itemToIndex.name_cap = recovery.name_cap;
				itemToIndex.variable = recovery.variable;
				itemToIndex.set = recovery.set;
				itemToIndex.iconFile = recovery.iconFile;
				if (recovery.outfitPrimary) {
					Object.entries(recovery.outfitPrimary).forEach(([key, value]) => {
						if (itemToIndex.outfitPrimary && (itemToIndex.outfitPrimary[key] === "broken" || itemToIndex.outfitPrimary[key] === "split")) {
							// Do Nothing
						} else {
							itemToIndex.outfitPrimary[key] = value;
						}
					});
					itemToIndex.outfitPrimary = recovery.outfitPrimary;
				}
				if (recovery.outfitSecondary && itemToIndex.outfitSecondary[1] !== "broken" && itemToIndex.outfitSecondary[1] !== "split")
					itemToIndex.outfitSecondary[1] = recovery.outfitSecondary[1];
			}
			console.log(`attempting to recover the mismatch, new index is '${recovery.index}'`);
			return recovery.index;
		} else {
			console.log("recovery failed, matches: " + matches);
			return 0;
		}
	}
	return index;
}

`<<widget "animatemodel">>`
const canvas = T.modelclass.canvas || T.modelclass.createCanvas();
T.modelclass.animate(canvas, T.modeloptions, Renderer.defaultListener);
canvas.canvas.className = typeof T.args[0] === 'string' ? T.args[0] : '';
output.append(canvas.canvas);

animate(canvas, options, listener) {
	this.canvas = canvas;
	this.options = options;
	this.listener = listener;
	this.animated = true;
	return this.redraw();
}

redraw() {
	if (!this.canvas) {
		Errors.report("CanvasModel.redraw() called but model was never rendered!");
		return;
	}
	Renderer.lastModel = this;

	if (this.animated) {
		return Renderer.animateLayers(this.canvas, this.compile(this.options), this.listener, true);
	} else {
		return Renderer.composeLayers(this.canvas, this.compile(this.options), this.canvas.canvas.width / this.width, this.listener);
	}
}

compile(options) {
	const debug = V.debug;
	if (!options) options = { filters: {} };
	if (!("filters" in options)) options.filters = {};
	try {
		this.preprocess(options);
	} catch (e) {
		console.error(e);
		throw new Error("Error in model preprocessing: " + e.stack.slice(0, e.stack.indexOf(Browser.isGecko ? "@" : "(eval")));
	}
	for (const layer of this.layerList) {
		// Reset some options
		layer.brightness = layer.defaultOptions.brightness;
		layer.contrast = layer.defaultOptions.contrast;
		layer.frameDx = 0;
		layer.frameDy = 0;
	}

	function propeval(layer, propname) {
		if (propname !== "show" && !debug && !layer.show) {
			// Situation A:
			// layer.srcfn: () => 'img/items/' + V.item.name + '.png'
			// and if V.item is undefined layer is skipped
			// So we don't want to eval skipped layer here
			//
			// Situation B:
			// Layer is skipped by mistake.
			// We want to debug its properties and show manually
			// So we might want to eval it still
			//
			// This is why we eval all properties in debug mode, but ignore their errors
			return;
		}
		const fnkey = propname + "fn";
		if (fnkey in layer) {
			try {
				layer[propname] = layer[fnkey](options);
			} catch (e) {
				if (layer.show) {
					console.error("Error evaluating layer " + layer.name + " property " + propname);
				}
			}
		}
	}

	const processLayer = layer => {
		layer.model = this;
		layer.show || propeval(layer, "show");
		propeval(layer, "src");
		if (!layer.src) {
			layer.src = ""; // force string value
			layer.show = false;
		}
		propeval(layer, "z");
		if (typeof layer.z !== "number" && layer.show !== false) {
			console.error("Layer " + layer.name + " missing property z");
		}
		propeval(layer, "alpha");
		propeval(layer, "maskAlpha");
		propeval(layer, "compositeOperation");
		propeval(layer, "blendMode");
		propeval(layer, "maskBlendMode");
		propeval(layer, "blend");
		propeval(layer, "desaturate");
		propeval(layer, "brightness");
		propeval(layer, "contrast");
		propeval(layer, "masksrc");
		propeval(layer, "animation");
		propeval(layer, "filters");
		propeval(layer, "dx");
		propeval(layer, "dy");
		propeval(layer, "width");
		propeval(layer, "height");
		propeval(layer, "worn");
		propeval(layer, "scale");
		if (!layer.scale) layer.scale = this.scale;
		if (layer.show !== false && layer.filters) {
			for (let filter of layer.filters) {
				if (typeof filter !== "object") {
					filter = options.filters[filter];
					if (!filter) {
						continue;
					}
				}
				if (!filter.blend) continue;
				Renderer.mergeLayerData(layer, filter, true);
			}
		}
	};

	for (const layer of this.layerList) {
		processLayer(layer);
	}

	this.postprocess(options);

	// Process generated layers after post-process
	const layers = [];
	if (options.generatedLayers) {
		for (const layer in options.generatedLayers) {
			processLayer(options.generatedLayers[layer]);
			layers.push(options.generatedLayers[layer]);
		}
	}

	return [...this.layerList, ...layers];
}

preprocess(options) {
	// Generate base skin tones
	options.filters.body = setup.colours.getSkinFilter(options.skin_type, 0);
	if (options.skin_type !== "custom") {
		options.filters.tan = setup.colours.getSkinFilter(options.skin_type, options.skin_tone);
	}

	const blink = options.trauma ? "blink-trauma" : "blink";
	options.blink_animation = options.blink ? blink : "";
	options.handheld_animation = V.worn.handheld.name === "heart hand warmer" ? "handWarmer" : "idle";

	options.filters.left_eye = lookupColour(options, setup.colours.eyes_map, options.left_eye, "eyes", "eyes_custom", "eyes");
	options.filters.right_eye = lookupColour(options, setup.colours.eyes_map, options.right_eye, "eyes", "eyes_custom", "eyes");

	if (options.hair_colour_style === "gradient") {
		options.filters.hair = createHairColourGradient(
			"sides",
			options.hair_colour_gradient,
			options.hair_sides_type,
			hairLengthStringToNumber(options.hair_sides_length),
			"hair"
		);
	}
	if (options.hair_colour_style === "simple") {
		options.filters.hair = lookupColour(
			options,
			setup.colours.hair_map,
			options.hair_colour,
			"hair",
			"hair_custom",
			"hair"
		);
	}
	if (options.hair_fringe_colour_style === "gradient") {
		options.filters.hair_fringe = createHairColourGradient(
			"fringe",
			options.hair_fringe_colour_gradient || options.hair_colour_gradient,
			options.hair_fringe_type,
			hairLengthStringToNumber(options.hair_sides_length),
			"hair_fringe"
		);
	}
	if (options.hair_fringe_colour_style === "simple") {
		options.filters.hair_fringe = lookupColour(
			options,
			setup.colours.hair_map,
			options.hair_fringe_colour || options.hair_colour,
			"hair_fringe",
			"hair_fringe_custom",
			"hair_fringe"
		);
	}

	const empty = Renderer.emptyLayerFilter();
	options.filters.brows = lookupColour(options, setup.colours.hair_map, options.brows_colour || options.hair_colour, "brows", "brows_custom", "brows");
	options.filters.pbhair = lookupColour(options, setup.colours.hair_map, options.pbhair_colour || options.hair_colour, "pbhair", "pbhair_custom", "pbhair");
	options.filters.lipstick = (options.lipstick_colour) ? lookupColour(
		options, setup.colours.lipstick_map, options.lipstick_colour, "lipstick", "lipstick_custom", "lipstick"
	) : empty;
	options.filters.eyeshadow = (options.eyeshadow_colour) ? lookupColour(
		options, setup.colours.eyeshadow_map, options.eyeshadow_colour, "eyeshadow", "eyeshadow_custom", "eyeshadow"
	) : empty;
	options.filters.mascara = (options.mascara_colour) ? lookupColour(
		options, setup.colours.mascara_map, options.mascara_colour, "mascara", "mascara_custom", "mascara"
	) : empty;

	if (options.condom_colour) options.filters.condom = lookupColour(options, setup.colours.condom_map, options.condom_colour, "condom", "condom_custom", "condom");

	if (options.breasts_parasite === "parasite") {
		options.filters.breasts_parasite = lookupColour(options, setup.colours.clothes_map, "red", "breasts_parasite");
	}
	if (["parasite", "parasitem"].includes(options.clit_parasite)) {
		options.filters.clit_parasite = lookupColour(options, setup.colours.clothes_map, "red", "clit_parasite");
	}
	if (options.penis_parasite === "parasite") {
		options.filters.penis_parasite = lookupColour(options, setup.colours.clothes_map, "red", "penis_parasite");
	}
	if (options.prop?.colour && options.prop?.colour !== "hair") {
		options.filters.prop = lookupColour(options, setup.colours.clothes_map, options.prop.colour, "prop");
	}
	if (options.prop?.accColour && options.prop?.accColour !== "hair") {
		options.filters.prop_acc = lookupColour(options, setup.colours.clothes_map, options.prop.accColour, "prop");
	}
	// Calculate blend pattern for demon TF
	const filterBase = {
		blendMode: "hard-light",
		brightness: 0,
		contrast: 1,
		desaturate: false,
	};
	// eslint-disable-next-line no-undef
	const demonHsl = ColourUtils.toHslString(Transformations.defaults.demon.colour);
	options.filters.demon_wings = { ...filterBase, blend: ColourUtils.toHslString(V.transformationParts.demon.wings_colour, demonHsl) };
	options.filters.demon_tail = { ...filterBase, blend: ColourUtils.toHslString(V.transformationParts.demon.tail_colour, demonHsl) };
	options.filters.demon_horns = { ...filterBase, blend: ColourUtils.toHslString(V.transformationParts.demon.horns_colour, demonHsl) };

	// Clothing filters and options
	const clothingObject = this.defaultOptions().worn;
	for (const slot of setup.clothes_all_slots) {
		const index = options.worn[slot]?.index ?? -1;
		if (index <= -1) continue;
		// Merge with default options
		clothingObject[slot].deepMerge(options.worn[slot]);

		let setupObj = clothingObject[slot].setup;
		if (!setupObj.variable) {
			setupObj = setup.clothes[slot][index];
			clothingObject[slot].setup = setupObj
		}

		setClothingFilter(options, slot, clothingObject[slot], setupObj, '', 'colour_sidebar', 'colour');
		setClothingFilter(options, slot, clothingObject[slot], setupObj, '_acc', 'accessory_colour_sidebar', 'accColour');
	}
	options.worn = clothingObject;

	// Show arm and hand just below outermost clothes layer to fully show its main/breasts layer and hide others
	// -0.1 is to move arms behind sleeves; to display gloves above sleeves they get +0.2 in hand layer decls

	if (options.worn.over_upper.index) {
		options.zarms = ZIndices.over_upper_arms - 0.1;
	} else if (options.worn.upper.index) {
		if (options.arm_left === "cover") {
			if (options.upper_tucked) {
				options.zarms = ZIndices.upper_arms_tucked - 0.1;
			} else {
				options.zarms = ZIndices.upper_arms - 0.1;
			}
		} else {
			options.zarms = ZIndices.under_upper_arms - 0.1;
		}
	} else if (options.worn.under_upper.index) {
		options.zarms = ZIndices.under_upper_arms - 0.1;
	} else {
		options.zarms = ZIndices.armsidle
	}


	// Do not put skin above sleeves
	if (options.worn.under_upper.setup.sleeve_img === 1) {
		options.zarms = ZIndices.under_upper_arms - 0.1;
	} else if (options.worn.upper.setup.sleeve_img === 1) {
		if (options.arm_left === "cover") {
			if (options.upper_tucked) {
				options.zarms = ZIndices.upper_arms_tucked - 0.1;
			} else {
				options.zarms = ZIndices.upper_arms - 0.1;
			}
		} else {
			options.zarms = ZIndices.under_upper_arms - 0.1;
		}
	}

	options.hideAll = false;
	if (options.worn.upper.setup.name === "cocoon") options.hideAll = true;

	options.zupper = (options.upper_tucked) ? ZIndices.upper_tucked : ZIndices.upper;
	options.zupperleft = (options.upper_tucked) ? ZIndices.upper_arms_tucked : ZIndices.upper_arms;
	options.zupperright = (options.upper_tucked) ? ZIndices.upper_arms_tucked : ZIndices.upper_arms;

	if (options.arm_right === "cover" || options.arm_right === "hold") options.zupperright = ZIndices.right_cover_arm + 1;
	if (options.arm_left === "cover") options.zupperleft = ZIndices.left_cover_arm + 1;
	if (options.worn.head.setup.name === "sage witch hat") {
		const ears = isPartEnabled(options.fox_ears_type) || isPartEnabled(options.wolf_ears_type) || isPartEnabled(options.cat_ears_type)
		if (ears) options.hideHeadAcc = true;
	}
	if (options.worn.neck.setup.name === "familiar collar") {
		if (T.magicLeash) {
			// For debug purposes to determine leash escapes
			V.magicLeashPassage = V.passage;
			V.magicLeashPassagePrev = V.passagePrev;
		} else if (!V.worn.neck.type.includes("leash")) {
			options.hideLeash = true;
		}
	}

	// Generate mask images
	options.lowerMask = [];
	options.lowerBellyMask = [];
	options.lowerShadowMask = [];
	options.underLowerMask = [];
	options.underLowerShadowMask = [];
	options.underUpperMask = [];
	options.upperMask = [];
	options.legsMask = [];
	if (options.worn.lower.setup.mask_img === 1) {
		options.lowerMask.push(
			gray_suffix(
				`img/clothes/lower/${options.worn.lower.setup.variable}/${options.worn.lower.integrity}.png`,
				options.filters['worn_lower']
			))
	}
	if (options.worn.upper.setup.mask_img === 1) {
		options.upperMask.push(
			gray_suffix(
				`img/clothes/upper/${options.worn.upper.setup.variable}/${options.worn.upper.integrity}.png`,
				options.filters['worn_upper']
			))
	}

	const hairTails = ["curly pigtails", "fluffy ponytail", "thick sidetail", "thick twintails", "ribbon tail", "thick sidetail", "thick ponytail", "half-up"];
	const thickTails = ["scorpion tails", "thick pigtails", "thick twintails"];
	const furCap = ["furcap f", "furcap m"];
	if (options.worn.upper.setup.mask_img === 1 && options.worn.upper.setup.name === "cocoon") {
		options.head_mask_src = "img/clothes/upper/cocoon/mask.png";
	} else if (
		options.worn.over_head.setup.mask_img === 1
		&& !(options.hood_down && options.worn.over_head.setup.hood && options.worn.over_head.setup.outfitSecondary !== undefined)
	) {
		options.head_mask_src = `img/clothes/head/${options.worn.over_head.setup.variable}/mask.png`;
	} else if (
		options.worn.head.setup.mask_img === 1
		&& !(options.hood_down && options.worn.head.setup.hood && options.worn.head.setup.outfitSecondary !== undefined)
	) {
		if (
			options.worn.head.setup.mask_img_ponytail === 1
			&& hairTails.includes(options.hair_sides_type)
			|| thickTails.includes(options.hair_sides_type)
			&& furCap.includes(options.worn.head.setup.variable)
		) {
			options.head_mask_src = `img/clothes/head/${options.worn.head.setup.variable}/mask_ponytail.png`;
		} else {
			options.head_mask_src = `img/clothes/head/${options.worn.head.setup.variable}/mask.png`;
		}
	} else {
		options.head_mask_src = null;
	}

	if (["fro", "afro pouf", "afro puffs"].includes(options.hair_sides_type) && options.hair_fringe_type === "fro") {
		options.fringe_mask_src = `img/hair/fringe/${options.hair_fringe_type}/mask.png`;
	} else {
		options.fringe_mask_src = null;
	}

	if (
		options.worn.upper.setup.type.includes("bellyHide")
		|| options.worn.lower.setup.type.includes("bellyHide")
		|| !V.worn.over_upper.type.includes("naked")
	) {
		options.belly -= 3;
	}

	const bellyDir = "img/clothes/belly"
	if (between(options.belly, 8, 24)) {
		options.belly_mask_lower_shadow_src = `${bellyDir}/shadow_${options.belly}.png`;
		options.lowerShadowMask.push(options.belly_mask_lower_shadow_src);
		options.underLowerShadowMask.push(options.belly_mask_lower_shadow_src);
		options.belly_mask_upper_shadow_src = `${bellyDir}/shadow_${options.belly}.png`;
	}

	if (between(options.belly, 15, 24)) {
		options.belly_mask_src = options.worn.upper.setup.pregType == "min" ?
			`${bellyDir}/mask_min_${options.belly}.png` : `${bellyDir}/mask_${options.belly}.png`;
		options.lowerBellyMask.push(options.belly_mask_src);

		if (V.worn.upper.outfitPrimary == undefined && options.worn.lower.setup.pregType !== "cover") {
			if (options.belly >= 19) {
				options.belly_hides_lower = true;
				options.belly_mask_clip_src = `${bellyDir}/mask_clip_${options.belly}.png`;
				options.lowerMask.push(options.belly_mask_clip_src);
				options.legsMask.push(options.belly_mask_clip_src);

				const check = options.worn.upper.setup.pregType == "split";
				const suffix = options.belly >= 22 ? "_big.png" : ".png";
				options.shirt_mask_clip_src = check ? `${bellyDir}/mask_shirt_clip${suffix}` : null;
				options.shirt_move_left_src = check ? `${bellyDir}/mask_shirt_left${suffix}` : null;
				options.shirt_move_left2_src = check ? `${bellyDir}/mask_shirt_left2.png` : null;
				options.shirt_move_right_src = check ? `${bellyDir}/mask_shirt_right.png` : null;
				options.shirt_move_right2_src = check ? `${bellyDir}/mask_shirt_right2.png` : null;
				options.shirt_move_right3_src = check ? `${bellyDir}/mask_shirt_right3.png` : null;

				if (check) options.shirt_mask_breasts_src = `${bellyDir}/mask_shirt_breasts.png`;
			} else {
				options.belly_mask_clip_src = null;
			}
		}

		if (V.worn.under_upper.outfitPrimary == undefined) {
			options.belly_hides_under_lower = true;
			options.underLowerMask.push(`${bellyDir}/mask_clip_${options.belly}.png`);
			options.underLowerShadowMask.push(`${bellyDir}/mask_clip_${options.belly}.png`);
		}
	}

	const notMasc = ["curvy", "slender"].includes(options.body_type);
	const soft = options.body_type === "soft" && !(between(options.belly, 8, 24));
	if (notMasc && options.breasts === "cleavage") {
		const suffix = between(options.breast_size, 3, 4) ? "-mid.png" : ".png";
		options.breasts_mask_src = `img/body/breasts/breasts-${options.body_type}${suffix}`
	} else {
		options.breasts_mask_src = null;
	}

	if (
		options.worn.neck.setup.name === "suspenders"
		&& options.worn.neck.setup.altposition != "alt"
		&& ["retro shorts", "retro trousers", "baseball shorts", "wide leg trousers"].includes(options.worn.lower.setup.name)
	) {
		options.high_waist_suspenders = true;
	} else {
		options.high_waist_suspenders = null;
	}

	if (notMasc) {
		["upper", "under_upper"].forEach(slot => {
			const isFormfitting = options.worn[slot].setup.formfitting;
			options[`${slot}_fitted_clip_src`] = isFormfitting ? `img/clothes/masks/formfitting_${options.body_type}.png` : null;
			options[`${slot}_fitted_right_move_src`] = isFormfitting ? "img/clothes/masks/formfitting_right_move.png" : null;
			options[`${slot}_fitted_left_move_src`] = isFormfitting ? "img/clothes/masks/formfitting_left_move.png" : null;
		});
	} else if (soft) {
		const upperCheck = !(options.worn.lower.setup.outfitSecondary && options.worn.lower.setup.outfitSecondary[1] === options.worn.upper.setup.name) && !options.worn.lower.setup.type.includes("covered") && !options.high_waist_suspenders && !options.belly_mask_clip_src;
		const underUpperCheck = !(options.worn.under_lower.setup.outfitSecondary && options.worn.under_lower.setup.outfitSecondary[1] === options.worn.under_upper.setup.name) && !options.belly_mask_clip_src;
		["upper", "under_upper"].forEach(slot => {
			options[`${slot}_fitted_right_move_src`] = "img/clothes/masks/soft_right_move.png";
			options[`${slot}_fitted_left_move_src`]  = "img/clothes/masks/soft_left_move.png";
		});
		options.lowerMask.push(upperCheck && !options.belly_tucked ? "img/clothes/masks/soft_lower_clip.png" : null);
		options.legsMask.push(upperCheck && !options.belly_tucked ? "img/clothes/masks/soft_lower_clip.png" : null);
		options.lowerShadowMask.push(upperCheck ? "img/clothes/masks/soft_shadow.png" : null);
		options.underLowerShadowMask.push(underUpperCheck ? "img/clothes/masks/soft_shadow.png" : null);
		options.underLowerMask.push(underUpperCheck? "img/clothes/masks/soft_lower_clip.png" : null);
	}

	if (options.lower_tucked && !options.worn.lower.setup.notuck && !options.worn.feet.setup.notuck) {
		options.feet_clip_src = `img/clothes/feet/${options.worn.feet.setup.variable}/mask.png`;
		options.lowerMask.push(options.feet_clip_src);
		options.legsMask.push(options.feet_clip_src);
		options.lowerBellyMask.push(options.feet_clip_src);
	} else if (!options.worn.feet.setup.notuck) {
		options.legsMask.push(`img/clothes/feet/${options.worn.feet.setup.variable}/mask.png`)
	} else {
		options.feet_clip_src = null;
	}

	options.genitals_chastity = options.worn.genitals.setup.type.includes("chastity");

	if (options.worn.handheld.setup.zIndex === "over_head" ) {
		options.handheld_overhead = true;
		options.angel_halo_lower = options.arm_right !== "cover";
	} else {
		options.handheld_overhead = null;
		options.angel_halo_lower = false;
	}

	if (options.arm_right === "hold") {
		options.handheld_position = 'hold';
	} else if (["right_cover"].includes(options.worn.handheld.setup.holdPosition)) {
		options.handheld_position = 'right_cover';
	} else {
		options.handheld_position = null;
	}

	options.genitals_chastity = options.worn.genitals.setup.type.includes("chastity");

	if (
		options.worn.head.setup.mask_img === 1
		&& !(options.hood_down && options.worn.head.setup.hood && options.worn.head.setup.outfitSecondary !== undefined)
	) {
		options.hood_mask = true;
	} else {
		options.hood_mask = null;
	}

	if (options.shirt_mask_clip_src) {
		options.underUpperMask.push(options.shirt_mask_clip_src)
		options.upperMask.push(options.shirt_mask_clip_src)
	} else {
		options.underUpperMask.push(options.upper_fitted_clip_src)
		options.upperMask.push(options.upper_fitted_clip_src)
	};


	/*clothes whose sleeves cannot be rolled up*/
	if (options.worn.upper.setup.variable === "schoolcardigan" && options.worn.upper.alt !== "alt") {
		options.alt_sleeve_state = null;
	} else {
		options.alt_sleeve_state = true;
	}
	T.canvasOptions = options;
},

defaultOptions() {
	return {
		"clothesPath": "img/clothes/",
		// group toggles
		"show_face": true,
		"show_hair": true,
		"show_writings": true,
		"show_tf": true,
		"show_clothes": true,
		// body
		"mannequin": false,
		"breasts": "",
		"breast_size": 1,
		"crotch_visible": false,
		"crotch_exposed": false,
		"penis": "",
		"penis_size": -1,
		"penis_parasite": "",
		"penis_condom": "",
		"condom_colour": "",
		"balls": false,
		"nipples_parasite": "",
		"chest_parasite": "",
		"clit_parasite": "",
		"arm_left": "idle",
		"arm_right": "idle",
		"body_type": "classic",
		// Skin & tan
		"skin_type": "light",
		"skin_tone": 0,
		"skin_scars":false,
		// Hair
		"hair_colour": "red",
		"hair_colour_gradient": {
			style: "split",
			colours: ["red", "black"]
		},
		"hair_colour_style": "simple",
		"hair_sides_type": "default",
		"hair_sides_length": "short",
		"hair_sides_position": "back",
		"hair_fringe_colour": "red",
		"hair_fringe_colour_gradient": {
			style: "split",
			colours: ["red", "black"]
		},
		"hair_fringe_colour_style": "simple",
		"hair_fringe_type": "default",
		"hair_fringe_length": "short",
		"brows_colour": "",
		"brows_position": "front",
		"pbhair_colour": "",
		"pbhair_level": 0,
		"pbhair_strip": 0,
		"pbhair_balls": 0,
		// Face
		"facestyle": "default",
		"facevariant": "default",
		"ears_position": "back",
		"freckles": false,
		"trauma": false,
		"blink": true,
		"eyes_half": false,
		"eyes_bloodshot": false,
		"left_eye": "purple",
		"right_eye": "purple",
		"brows": "none",
		"mouth": "none",
		"tears": 0,
		"blush": 0,
		"toast": 0,
		"lipstick_colour": "",
		"eyeshadow_colour": "",
		"mascara_colour": "",
		"mascara_running": 0,
		"blusher_colour": "",
		"makeup_adjustment": 0,
		// tf
		"angel_wings_type": "disabled",
		"angel_wing_right": "idle",
		"angel_wing_left": "idle",
		"angel_wings_layer": "front",
		"angel_halo_type": "disabled",
		"angel_halo_lower": false,
		"fallen_wings_type": "disabled",
		"fallen_wing_right": "idle",
		"fallen_wing_left": "idle",
		"fallen_wings_layer": "front",
		"fallen_halo_type": "disabled",
		"demon_wings_type": "disabled",
		"demon_wings_state": "idle",
		"demon_wings_layer": "front",
		"demon_tail_type": "disabled",
		"demon_tail_state": "idle",
		"demon_tail_layer": "front",
		"demon_horns_type": "disabled",
		"demon_horns_layer": "back",
		"wolf_tail_type": "disabled",
		"wolf_tail_layer": "front",
		"wolf_ears_type": "disabled",
		"wolf_pits_type": "disabled",
		"wolf_pubes_type": "disabled",
		"wolf_cheeks_type": "disabled",
		"cat_tail_type": "disabled",
		"cat_tail_state": "idle",
		"cat_tail_layer": "front",
		"cat_ears_type": "disabled",
		"cow_horns_type": "disabled",
		"cow_horns_layer": "back",
		"cow_tail_type": "disabled",
		"cow_tail_layer": "front",
		"cow_ears_type": "disabled",
		"bird_wings_type": "disabled",
		"bird_wing_right": "idle",
		"bird_wing_left": "idle",
		"bird_wings_layer": "front",
		"bird_tail_type": "disabled",
		"bird_tail_layer": "front",
		"bird_eyes_type": "disabled",
		"bird_malar_type": "disabled",
		"bird_plumage_type": "disabled",
		"bird_pubes_type": "disabled",
		"fox_tail_type": "disabled",
		"fox_tail_layer": "front",
		"fox_ears_type": "disabled",
		"fox_cheeks_type": "disabled",
		// body writings
		"writing_forehead": "",
		"writing_left_cheek": "",
		"writing_right_cheek": "",
		"writing_breasts": "",
		"writing_left_shoulder": "",
		"writing_right_shoulder": "",
		"writing_pubic": "",
		"writing_left_thigh": "",
		"writing_right_thigh": "",
		// fluids
		"drip_vaginal": "",
		"drip_anal": "",
		"drip_mouth": "",
		"cum_chest": "",
		"cum_face": "",
		"cum_feet": "",
		"cum_leftarm": "",
		"cum_rightarm": "",
		"cum_neck": "",
		"cum_thigh": "",
		"cum_tummy": "",
		// clothing
		"worn": {
			upper: {
				index: 0,
				alpha: 1,
				integrity: "full",
				colour: "white",
				accColour: "white",
				pattern: 0,
				setup: { type: [] },
			},
			genitals: {
				index: 0,
				alpha: 1,
				integrity: "full",
				colour: "white",
				accColour: "white",
				pattern: 0,
				setup: { type: [] },
			},
			over_upper: {
				index: 0,
				alpha: 1,
				integrity: "full",
				colour: "white",
				accColour: "white",
				pattern: 0,
				setup: { type: [] },
			},
			lower: {
				index: 0,
				alpha: 1,
				integrity: "full",
				colour: "white",
				accColour: "white",
				pattern: 0,
				setup: { type: [] },
			},
			over_lower: {
				index: 0,
				alpha: 1,
				integrity: "full",
				colour: "white",
				accColour: "white",
				pattern: 0,
				setup: { type: [] },
			},
			under_lower: {
				index: 0,
				alpha: 1,
				integrity: "full",
				colour: "white",
				accColour: "white",
				pattern: 0,
				setup: { type: [] },
			},
			under_upper: {
				index: 0,
				alpha: 1,
				integrity: "full",
				colour: "white",
				accColour: "white",
				pattern: 0,
				setup: { type: [] },
			},
			hands: {
				index: 0,
				alpha: 1,
				integrity: "full",
				colour: "white",
				accColour: "white",
				pattern: 0,
				setup: { type: [] },
			},
			handheld: {
				index: 0,
				alpha: 1,
				integrity: "full",
				colour: "white",
				accColour: "white",
				pattern: 0,
				setup: { type: [] },
			},
			head: {
				index: 0,
				alpha: 1,
				integrity: "full",
				colour: "white",
				accColour: "white",
				pattern: 0,
				setup: { type: [] },
			},
			over_head: {
				index: 0,
				alpha: 1,
				integrity: "full",
				colour: "white",
				accColour: "white",
				pattern: 0,
				setup: { type: [] },
			},
			face: {
				index: 0,
				alpha: 1,
				integrity: "full",
				colour: "white",
				accColour: "white",
				pattern: 0,
				setup: { type: [] },
			},
			neck: {
				index: 0,
				alpha: 1,
				integrity: "full",
				colour: "white",
				accColour: "white",
				pattern: 0,
				setup: { type: [] },
			},
			legs: {
				index: 0,
				alpha: 1,
				integrity: "full",
				colour: "white",
				accColour: "white",
				pattern: 0,
				setup: { type: [] },
			},
			feet: {
				index: 0,
				alpha: 1,
				integrity: "full",
				colour: "white",
				accColour: "white",
				pattern: 0,
				setup: { type: [] },
			}
		},
		// followers
		"follower": false,
		//weather
		"precipitation_back": "",
		"precipitation_front": "",
		"cold_breath": "",
		"water_back": "",
		"water_front": "",
		"water_breath": "",
		"fire_back": "",
		"fire_front": "",
		// misc
		"tanningEnabled": true,
		"genitals_chastity": false, // generated option
		"handheld_overhead": false, // generated option
		"upper_tucked": false,
		"lower_tucked": false,
		"hood_down": false,
		"alt_sleeve": false,
		"acc_layer_under": false,
		"head_mask_src": "", // generated option
		"belly_mask_src": "", // generated option
		"blink_animation": "", // generated option
		"zarms": ZIndices.armsidle, // generated options
		"zupper": ZIndices.upper, // generated options
		"zupperleft": ZIndices.upper_arms, // generated options
		"zupperright": ZIndices.upper_arms, // generated options
		// filters
		"filters": {
			body: { blend: "#ffffff", blendMode: "multiply", desaturate: false },
		},
	}
},

function setClothingFilter(options, slot, clothingObject, setupObj, filterSuffix, colourProp, customProp) {
	const filterType = `worn_${slot}${filterSuffix}`;
	const colour = clothingObject[customProp];

	options.filters[filterType] = (setupObj[colourProp])
		? lookupColour(
			options,
			setup.colours.clothes_map,
			colour,
			`${slot} ${filterSuffix.includes('_acc') ? 'accessory' : 'clothing'}`,
			`${filterType}_custom`,
			setupObj.prefilter
		)
		: Renderer.emptyLayerFilter();
}

function lookupColour(options, dict, key, debugName, customFilterName, prefilterName) {
	let filter;
	if (key === "custom") {
		filter = clone(options.filters[customFilterName]);
		if (!filter) {
			console.error(`custom ${debugName} colour not configured`);
			return {};
		}
	} else if (key !== "original") {
		let record = dict[key];
		if (!record) {
			console.error(`unknown ${debugName} colour: ${key}`);
			return {};
		}
		filter = clone(record.canvasfilter);
	}

	if (prefilterName) {
		Renderer.mergeLayerData(
			filter,
			setup.colours.sprite_prefilters[prefilterName],
			true
		);
	}
	return filter;
}