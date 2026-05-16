[
  {
    "animation": "idle",
    "alphafn": [
      "(revive:eval)",
      "(alphafn(options) {
            return options.worn[slot].alpha;
        })"
    ],
    "wornfn": [
      "(revive:eval)",
      "(wornfn(options) {
            return {
                slot,
                integrity: options.worn[slot].integrity,
                alt: options.worn[slot].alt,
                index: options.worn[slot].setup.index
            }
        })"
    ],
    "z": 95,
    "filtersfn": [
      "(revive:eval)",
      "(filtersfn(options) {
            const altFilterSwap = !options.alt_override
                && options.worn[slot].setup.altposition !== undefined
                && options.worn[slot].alt === \'alt\'
                && options.worn[slot].setup.altdisabled.includes(\'filter\');
            return altFilterSwap ? [`worn_${slot}_acc`] : [`worn_${slot}`];
        })"
    ],
    "showfn": [
      "(revive:eval)",
      "(showfn(options) {
            return options.show_clothes
                && options.worn[slot].index > 0
                && options.worn[slot].setup.mainImage !== 0;
        })"
    ],
    "srcfn": [
      "(revive:eval)",
      "(srcfn(options) {
            const setup = options.worn[slot].setup;

            const isHoodDown = options.hood_down
                && setup.hoodposition !== undefined
                && setup.outfitPrimary.head !== undefined;
            const isAltPosition = !options.alt_override && setup.altposition !== undefined
                && options.worn[slot].alt === \\"alt\\"
                && !setup.altdisabled.includes(\\"full\\");

            const pattern = options.worn[slot].pattern && ![\\"secondary\\", \\"tertiary\\"].includes(options.worn[slot].setup.pattern_layer) ? \\"_\\" + options.worn[slot].pattern?.replace(/ /g,\\"_\\") : \'\';

            const end = isHoodDown ? \'_down\' : isAltPosition ? \'_alt\' : \'\';
            const path = `img/clothes/${slot}/${setup.variable}/${options.worn[slot].integrity}${pattern}${end}.png`;
            return gray_suffix(path, options.filters[`worn_${slot}`]);
        })"
    ],
    "zfn": [
      "(revive:eval)",
      "(zfn(options) {
                return options.worn.upper.setup.name === \\"cocoon\\" ? ZIndices.over_head : options.zupper;
            })"
    ],
    "masksrcfn": [
      "(revive:eval)",
      "(masksrcfn(options) {
                return options.upperMask;
            })"
    ],
    "name": "upper_main",
    "show": true,
    "brightness": 0,
    "contrast": 1,
    "blend": "#353535",
    "blendMode": "hard-light",
    "maskBlendMode": "destination-in",
    "alpha": 1,
    "desaturate": false,
    "defaultOptions": {
      "animation": "idle",
      "alphafn": [
        "(revive:eval)",
        "(alphafn(options) {
            return options.worn[slot].alpha;
        })"
      ],
      "wornfn": [
        "(revive:eval)",
        "(wornfn(options) {
            return {
                slot,
                integrity: options.worn[slot].integrity,
                alt: options.worn[slot].alt,
                index: options.worn[slot].setup.index
            }
        })"
      ],
      "z": 95,
      "filtersfn": [
        "(revive:eval)",
        "(filtersfn(options) {
            const altFilterSwap = !options.alt_override
                && options.worn[slot].setup.altposition !== undefined
                && options.worn[slot].alt === \'alt\'
                && options.worn[slot].setup.altdisabled.includes(\'filter\');
            return altFilterSwap ? [`worn_${slot}_acc`] : [`worn_${slot}`];
        })"
      ],
      "showfn": [
        "(revive:eval)",
        "(showfn(options) {
            return options.show_clothes
                && options.worn[slot].index > 0
                && options.worn[slot].setup.mainImage !== 0;
        })"
      ],
      "srcfn": [
        "(revive:eval)",
        "(srcfn(options) {
            const setup = options.worn[slot].setup;

            const isHoodDown = options.hood_down
                && setup.hoodposition !== undefined
                && setup.outfitPrimary.head !== undefined;
            const isAltPosition = !options.alt_override && setup.altposition !== undefined
                && options.worn[slot].alt === \\"alt\\"
                && !setup.altdisabled.includes(\\"full\\");

            const pattern = options.worn[slot].pattern && ![\\"secondary\\", \\"tertiary\\"].includes(options.worn[slot].setup.pattern_layer) ? \\"_\\" + options.worn[slot].pattern?.replace(/ /g,\\"_\\") : \'\';

            const end = isHoodDown ? \'_down\' : isAltPosition ? \'_alt\' : \'\';
            const path = `img/clothes/${slot}/${setup.variable}/${options.worn[slot].integrity}${pattern}${end}.png`;
            return gray_suffix(path, options.filters[`worn_${slot}`]);
        })"
      ],
      "zfn": [
        "(revive:eval)",
        "(zfn(options) {
                return options.worn.upper.setup.name === \\"cocoon\\" ? ZIndices.over_head : options.zupper;
            })"
      ],
      "masksrcfn": [
        "(revive:eval)",
        "(masksrcfn(options) {
                return options.upperMask;
            })"
      ],
      "name": "upper_main",
      "show": false,
      "brightness": 0,
      "contrast": 1,
      "blend": "",
      "blendMode": "",
      "maskBlendMode": "destination-in",
      "alpha": 1,
      "desaturate": false
    },
    "frameDx": 0,
    "frameDy": 0,
    "model": [
      "(revive:eval)",
      "undefined"
    ],
    "src": "img/clothes/upper/tanktop/tattered_gray.png",
    "masksrc": null,
    "filters": [
      "worn_upper"
    ],
    "worn": {
      "slot": "upper",
      "integrity": "tattered",
      "alt": [
        "(revive:eval)",
        "undefined"
      ],
      "index": 8
    },
    "scale": true,
    "frames": [
      0
    ],
    "maskOffsets": [],
    "maskOptions": {
      "convert": false
    },
    "image": {},
    "imageSrc": "img/clothes/upper/tanktop/tattered_gray.png",
    "cachedProcessing": "{\\"src\\":\\"img/clothes/upper/tanktop/tattered_gray.png\\",\\"blend\\":\\"#353535\\",\\"blendMode\\":\\"hard-light\\",\\"desaturate\\":false,\\"brightness\\":0,\\"contrast\\":1,\\"prefilter\\":[\\"(revive:eval)\\",\\"undefined\\"],\\"masksrc\\":null}",
    "cachedImage": {}
  },
  {
    "animation": "idle",
    "alphafn": [
      "(revive:eval)",
      "(alphafn(options) {
            return options.worn[slot].alpha;
        })"
    ],
    "wornfn": [
      "(revive:eval)",
      "(wornfn(options) {
            return {
                slot,
                integrity: options.worn[slot].integrity,
                alt: options.worn[slot].alt,
                index: options.worn[slot].setup.index
            }
        })"
    ],
    "z": 95,
    "filtersfn": [
      "(revive:eval)",
      "(filtersfn(options) {
            const altFilterSwap = !options.alt_override
                && options.worn[slot].setup.altposition !== undefined
                && options.worn[slot].alt === \'alt\'
                && options.worn[slot].setup.altdisabled.includes(\'filter\');
            return altFilterSwap ? [`worn_${slot}_acc`] : [`worn_${slot}`];
        })"
    ],
    "showfn": [
      "(revive:eval)",
      "(showfn(options) {
            let breastImg = options.worn[slot].setup.breast_img;
            if (typeof breastImg === \'object\' && breastImg[options.breast_size] !== null) breastImg = 1;
            return options.show_clothes && options.worn[slot].index > 0 && breastImg === 1;
        })"
    ],
    "srcfn": [
      "(revive:eval)",
      "(srcfn(options) {
            const setup = options.worn[slot].setup;
            const breastImg = setup.breast_img;

            const isAltPosition = !options.alt_override
                && setup.altposition !== undefined
                && options.worn[slot].alt === \\"alt\\"
                && !setup.altdisabled.includes(\\"breasts\\");

            const breastSize = typeof breastImg === \'object\' ? breastImg[options.breast_size] : Math.min(options.breast_size, 6);
            const pattern = options.worn[slot].pattern && ![\\"tertiary\\", \\"secondary\\"].includes(options.worn[slot].setup.pattern_layer) ? \\"_\\" + options.worn[slot].pattern?.replace(/ /g,\\"_\\") : \'\';
            const end = isAltPosition ? \'_alt\' : \'\';
            const path = `img/clothes/${slot}/${setup.variable}/${breastSize}${pattern}${end}.png`;
            return gray_suffix(path, options.filters[`worn_${slot}`]);
        })"
    ],
    "masksrcfn": [
      "(revive:eval)",
      "(masksrcfn(options) {
            if (options.belly >= 19) return options.shirt_mask_breasts_src;

            const variable = options.worn[slot].setup.variable;
            const integrity = options.worn[slot].integrity;
            if (options.worn[slot].setup.mask_img === 1) return `img/clothes/${slot}/${variable}/mask_${integrity}.png`;
            return null;
        })"
    ],
    "zfn": [
      "(revive:eval)",
      "(zfn(options) {
                return options.acc_layer_under ? ZIndices.upper + 1 : options.zupper;
            })"
    ],
    "name": "upper_breasts",
    "show": true,
    "brightness": 0,
    "contrast": 1,
    "blend": "#353535",
    "blendMode": "hard-light",
    "maskBlendMode": "destination-in",
    "alpha": 1,
    "desaturate": false,
    "defaultOptions": {
      "animation": "idle",
      "alphafn": [
        "(revive:eval)",
        "(alphafn(options) {
            return options.worn[slot].alpha;
        })"
      ],
      "wornfn": [
        "(revive:eval)",
        "(wornfn(options) {
            return {
                slot,
                integrity: options.worn[slot].integrity,
                alt: options.worn[slot].alt,
                index: options.worn[slot].setup.index
            }
        })"
      ],
      "z": 95,
      "filtersfn": [
        "(revive:eval)",
        "(filtersfn(options) {
            const altFilterSwap = !options.alt_override
                && options.worn[slot].setup.altposition !== undefined
                && options.worn[slot].alt === \'alt\'
                && options.worn[slot].setup.altdisabled.includes(\'filter\');
            return altFilterSwap ? [`worn_${slot}_acc`] : [`worn_${slot}`];
        })"
      ],
      "showfn": [
        "(revive:eval)",
        "(showfn(options) {
            let breastImg = options.worn[slot].setup.breast_img;
            if (typeof breastImg === \'object\' && breastImg[options.breast_size] !== null) breastImg = 1;
            return options.show_clothes && options.worn[slot].index > 0 && breastImg === 1;
        })"
      ],
      "srcfn": [
        "(revive:eval)",
        "(srcfn(options) {
            const setup = options.worn[slot].setup;
            const breastImg = setup.breast_img;

            const isAltPosition = !options.alt_override
                && setup.altposition !== undefined
                && options.worn[slot].alt === \\"alt\\"
                && !setup.altdisabled.includes(\\"breasts\\");

            const breastSize = typeof breastImg === \'object\' ? breastImg[options.breast_size] : Math.min(options.breast_size, 6);
            const pattern = options.worn[slot].pattern && ![\\"tertiary\\", \\"secondary\\"].includes(options.worn[slot].setup.pattern_layer) ? \\"_\\" + options.worn[slot].pattern?.replace(/ /g,\\"_\\") : \'\';
            const end = isAltPosition ? \'_alt\' : \'\';
            const path = `img/clothes/${slot}/${setup.variable}/${breastSize}${pattern}${end}.png`;
            return gray_suffix(path, options.filters[`worn_${slot}`]);
        })"
      ],
      "masksrcfn": [
        "(revive:eval)",
        "(masksrcfn(options) {
            if (options.belly >= 19) return options.shirt_mask_breasts_src;

            const variable = options.worn[slot].setup.variable;
            const integrity = options.worn[slot].integrity;
            if (options.worn[slot].setup.mask_img === 1) return `img/clothes/${slot}/${variable}/mask_${integrity}.png`;
            return null;
        })"
      ],
      "zfn": [
        "(revive:eval)",
        "(zfn(options) {
                return options.acc_layer_under ? ZIndices.upper + 1 : options.zupper;
            })"
      ],
      "name": "upper_breasts",
      "show": false,
      "brightness": 0,
      "contrast": 1,
      "blend": "",
      "blendMode": "",
      "maskBlendMode": "destination-in",
      "alpha": 1,
      "desaturate": false
    },
    "frameDx": 0,
    "frameDy": 0,
    "model": [
      "(revive:eval)",
      "undefined"
    ],
    "src": "img/clothes/upper/tanktop/5_gray.png",
    "masksrc": null,
    "filters": [
      "worn_upper"
    ],
    "worn": {
      "slot": "upper",
      "integrity": "tattered",
      "alt": [
        "(revive:eval)",
        "undefined"
      ],
      "index": 8
    },
    "scale": true,
    "frames": [
      0
    ],
    "maskOffsets": [],
    "maskOptions": {
      "convert": false
    },
    "image": {},
    "imageSrc": "img/clothes/upper/tanktop/5_gray.png",
    "cachedProcessing": "{\\"src\\":\\"img/clothes/upper/tanktop/5_gray.png\\",\\"blend\\":\\"#353535\\",\\"blendMode\\":\\"hard-light\\",\\"desaturate\\":false,\\"brightness\\":0,\\"contrast\\":1,\\"prefilter\\":[\\"(revive:eval)\\",\\"undefined\\"],\\"masksrc\\":null}",
    "cachedImage": {}
  },
  {
    "animation": "idle",
    "alphafn": [
      "(revive:eval)",
      "(alphafn(options) {
            return options.worn[slot].alpha;
        })"
    ],
    "wornfn": [
      "(revive:eval)",
      "(wornfn(options) {
            return {
                slot,
                integrity: options.worn[slot].integrity,
                alt: options.worn[slot].alt,
                index: options.worn[slot].setup.index
            }
        })"
    ],
    "z": 90,
    "filtersfn": [
      "(revive:eval)",
      "(filtersfn(options) {
            const altFilterSwap = !options.alt_override
                && options.worn[slot].setup.altposition !== undefined
                && options.worn[slot].alt === \'alt\'
                && options.worn[slot].setup.altdisabled.includes(\'filter\');
            return altFilterSwap ? [`worn_${slot}_acc`] : [`worn_${slot}`];
        })"
    ],
    "showfn": [
      "(revive:eval)",
      "(showfn(options) {
            return options.show_clothes
                && options.worn[slot].index > 0
                && options.worn[slot].setup.mainImage !== 0;
        })"
    ],
    "srcfn": [
      "(revive:eval)",
      "(srcfn(options) {
            const setup = options.worn[slot].setup;

            const isHoodDown = options.hood_down
                && setup.hoodposition !== undefined
                && setup.outfitPrimary.head !== undefined;
            const isAltPosition = !options.alt_override && setup.altposition !== undefined
                && options.worn[slot].alt === \\"alt\\"
                && !setup.altdisabled.includes(\\"full\\");

            const pattern = options.worn[slot].pattern && ![\\"secondary\\", \\"tertiary\\"].includes(options.worn[slot].setup.pattern_layer) ? \\"_\\" + options.worn[slot].pattern?.replace(/ /g,\\"_\\") : \'\';

            const end = isHoodDown ? \'_down\' : isAltPosition ? \'_alt\' : \'\';
            const path = `img/clothes/${slot}/${setup.variable}/${options.worn[slot].integrity}${pattern}${end}.png`;
            return gray_suffix(path, options.filters[`worn_${slot}`]);
        })"
    ],
    "zfn": [
      "(revive:eval)",
      "(zfn(options) {
                const secondary = options.worn.lower.setup.type.includes(\\"covered\\") ? ZIndices.lower_cover : ZIndices.lower;
                return options.worn.lower.setup.high_img ? ZIndices.lower_high : secondary;
            })"
    ],
    "masksrcfn": [
      "(revive:eval)",
      "(masksrcfn(options) {
                return options.lowerMask;
            })"
    ],
    "name": "lower",
    "show": true,
    "brightness": 0,
    "contrast": 1,
    "blend": "#703000",
    "blendMode": "hard-light",
    "maskBlendMode": "destination-in",
    "alpha": 1,
    "desaturate": false,
    "defaultOptions": {
      "animation": "idle",
      "alphafn": [
        "(revive:eval)",
        "(alphafn(options) {
            return options.worn[slot].alpha;
        })"
      ],
      "wornfn": [
        "(revive:eval)",
        "(wornfn(options) {
            return {
                slot,
                integrity: options.worn[slot].integrity,
                alt: options.worn[slot].alt,
                index: options.worn[slot].setup.index
            }
        })"
      ],
      "z": 90,
      "filtersfn": [
        "(revive:eval)",
        "(filtersfn(options) {
            const altFilterSwap = !options.alt_override
                && options.worn[slot].setup.altposition !== undefined
                && options.worn[slot].alt === \'alt\'
                && options.worn[slot].setup.altdisabled.includes(\'filter\');
            return altFilterSwap ? [`worn_${slot}_acc`] : [`worn_${slot}`];
        })"
      ],
      "showfn": [
        "(revive:eval)",
        "(showfn(options) {
            return options.show_clothes
                && options.worn[slot].index > 0
                && options.worn[slot].setup.mainImage !== 0;
        })"
      ],
      "srcfn": [
        "(revive:eval)",
        "(srcfn(options) {
            const setup = options.worn[slot].setup;

            const isHoodDown = options.hood_down
                && setup.hoodposition !== undefined
                && setup.outfitPrimary.head !== undefined;
            const isAltPosition = !options.alt_override && setup.altposition !== undefined
                && options.worn[slot].alt === \\"alt\\"
                && !setup.altdisabled.includes(\\"full\\");

            const pattern = options.worn[slot].pattern && ![\\"secondary\\", \\"tertiary\\"].includes(options.worn[slot].setup.pattern_layer) ? \\"_\\" + options.worn[slot].pattern?.replace(/ /g,\\"_\\") : \'\';

            const end = isHoodDown ? \'_down\' : isAltPosition ? \'_alt\' : \'\';
            const path = `img/clothes/${slot}/${setup.variable}/${options.worn[slot].integrity}${pattern}${end}.png`;
            return gray_suffix(path, options.filters[`worn_${slot}`]);
        })"
      ],
      "zfn": [
        "(revive:eval)",
        "(zfn(options) {
                const secondary = options.worn.lower.setup.type.includes(\\"covered\\") ? ZIndices.lower_cover : ZIndices.lower;
                return options.worn.lower.setup.high_img ? ZIndices.lower_high : secondary;
            })"
      ],
      "masksrcfn": [
        "(revive:eval)",
        "(masksrcfn(options) {
                return options.lowerMask;
            })"
      ],
      "name": "lower",
      "show": false,
      "brightness": 0,
      "contrast": 1,
      "blend": "",
      "blendMode": "",
      "maskBlendMode": "destination-in",
      "alpha": 1,
      "desaturate": false
    },
    "frameDx": 0,
    "frameDy": 0,
    "model": [
      "(revive:eval)",
      "undefined"
    ],
    "src": "img/clothes/lower/shorts/tattered_gray.png",
    "masksrc": [
      "img/clothes/masks/soft_lower_clip.png"
    ],
    "filters": [
      "worn_lower"
    ],
    "worn": {
      "slot": "lower",
      "integrity": "tattered",
      "alt": [
        "(revive:eval)",
        "undefined"
      ],
      "index": 5
    },
    "scale": true,
    "frames": [
      0
    ],
    "maskOffsets": [],
    "maskOptions": {
      "convert": false
    },
    "image": {},
    "imageSrc": "img/clothes/lower/shorts/tattered_gray.png",
    "cachedProcessing": "{\\"src\\":\\"img/clothes/lower/shorts/tattered_gray.png\\",\\"blend\\":\\"#703000\\",\\"blendMode\\":\\"hard-light\\",\\"desaturate\\":false,\\"brightness\\":0,\\"contrast\\":1,\\"prefilter\\":[\\"(revive:eval)\\",\\"undefined\\"],\\"masksrc\\":[\\"img/clothes/masks/soft_lower_clip.png\\"]}",
    "cachedImage": {},
    "mask": [
      {}
    ],
    "cachedMaskSrc": "[Circular]"
  },
  {
    "animation": "idle",
    "alphafn": [
      "(revive:eval)",
      "(alphafn(options) {
            return options.worn[slot].alpha;
        })"
    ],
    "wornfn": [
      "(revive:eval)",
      "(wornfn(options) {
            return {
                slot,
                integrity: options.worn[slot].integrity,
                alt: options.worn[slot].alt,
                index: options.worn[slot].setup.index
            }
        })"
    ],
    "z": 94.5,
    "filtersfn": [
      "(revive:eval)",
      "(filtersfn(options) {
            const altFilterSwap = !options.alt_override
                && options.worn[slot].setup.altposition !== undefined
                && options.worn[slot].alt === \'alt\'
                && options.worn[slot].setup.altdisabled.includes(\'filter\');
            return altFilterSwap ? [`worn_${slot}_acc`] : [`worn_${slot}`];
        })"
    ],
    "showfn": [
      "(revive:eval)",
      "(showfn(options) {
            return (options.belly > 7 || (options.body_type === \\"soft\\" && !options.worn[slot].setup.outfitSecondary))
                && options.show_clothes
                && options.worn[slot].index > 0
                && options.worn[slot].setup.mainImage !== 0;
        })"
    ],
    "srcfn": [
      "(revive:eval)",
      "(srcfn(options) {
            const pattern = options.worn[slot].pattern && ![\\"tertiary\\", \\"secondary\\"].includes(options.worn[slot].setup.pattern_layer) ? \\"_\\" + options.worn[slot].pattern?.replace(/ /g,\\"_\\") : \'\';
            return gray_suffix(
                `img/clothes/${slot}/${options.worn[slot].setup.variable}/${options.worn[slot].integrity}${pattern}.png`,
                options.filters[`worn_${slot}`]
            );
        })"
    ],
    "brightnessfn": [
      "(revive:eval)",
      "(brightnessfn(options) {
            const mask = ((slot === \\"lower\\" && options.lowerShadowMask) || (slot === \\"under_lower\\" && options.underLowerShadowMask && !playerHasStrapon()))
            return between(options.belly, 8, 24) && mask ? -0.25 : options.body_type === \\"soft\\" && mask ? -0.4 : 0;
        })"
    ],
    "masksrcfn": [
      "(revive:eval)",
      "(masksrcfn(options) {
            return slot === \\"lower\\" ? options.lowerShadowMask : slot === \\"under_lower\\" && !playerHasStrapon() ? options.underLowerShadowMask : \\"\\"
        })"
    ],
    "zfn": [
      "(revive:eval)",
      "(zfn(options) {
                return options.worn.lower.setup.high_img ? ZIndices.lower_high : ZIndices.lower_belly;
            })"
    ],
    "name": "lower_belly_shadow",
    "show": true,
    "brightness": -0.4,
    "contrast": 1,
    "blend": "#703000",
    "blendMode": "hard-light",
    "maskBlendMode": "destination-in",
    "alpha": 1,
    "desaturate": false,
    "defaultOptions": {
      "animation": "idle",
      "alphafn": [
        "(revive:eval)",
        "(alphafn(options) {
            return options.worn[slot].alpha;
        })"
      ],
      "wornfn": [
        "(revive:eval)",
        "(wornfn(options) {
            return {
                slot,
                integrity: options.worn[slot].integrity,
                alt: options.worn[slot].alt,
                index: options.worn[slot].setup.index
            }
        })"
      ],
      "z": 99,
      "filtersfn": [
        "(revive:eval)",
        "(filtersfn(options) {
            const altFilterSwap = !options.alt_override
                && options.worn[slot].setup.altposition !== undefined
                && options.worn[slot].alt === \'alt\'
                && options.worn[slot].setup.altdisabled.includes(\'filter\');
            return altFilterSwap ? [`worn_${slot}_acc`] : [`worn_${slot}`];
        })"
      ],
      "showfn": [
        "(revive:eval)",
        "(showfn(options) {
            return (options.belly > 7 || (options.body_type === \\"soft\\" && !options.worn[slot].setup.outfitSecondary))
                && options.show_clothes
                && options.worn[slot].index > 0
                && options.worn[slot].setup.mainImage !== 0;
        })"
      ],
      "srcfn": [
        "(revive:eval)",
        "(srcfn(options) {
            const pattern = options.worn[slot].pattern && ![\\"tertiary\\", \\"secondary\\"].includes(options.worn[slot].setup.pattern_layer) ? \\"_\\" + options.worn[slot].pattern?.replace(/ /g,\\"_\\") : \'\';
            return gray_suffix(
                `img/clothes/${slot}/${options.worn[slot].setup.variable}/${options.worn[slot].integrity}${pattern}.png`,
                options.filters[`worn_${slot}`]
            );
        })"
      ],
      "brightnessfn": [
        "(revive:eval)",
        "(brightnessfn(options) {
            const mask = ((slot === \\"lower\\" && options.lowerShadowMask) || (slot === \\"under_lower\\" && options.underLowerShadowMask && !playerHasStrapon()))
            return between(options.belly, 8, 24) && mask ? -0.25 : options.body_type === \\"soft\\" && mask ? -0.4 : 0;
        })"
      ],
      "masksrcfn": [
        "(revive:eval)",
        "(masksrcfn(options) {
            return slot === \\"lower\\" ? options.lowerShadowMask : slot === \\"under_lower\\" && !playerHasStrapon() ? options.underLowerShadowMask : \\"\\"
        })"
      ],
      "zfn": [
        "(revive:eval)",
        "(zfn(options) {
                return options.worn.lower.setup.high_img ? ZIndices.lower_high : ZIndices.lower_belly;
            })"
      ],
      "name": "lower_belly_shadow",
      "show": false,
      "brightness": 0,
      "contrast": 1,
      "blend": "",
      "blendMode": "",
      "maskBlendMode": "destination-in",
      "alpha": 1,
      "desaturate": false
    },
    "frameDx": 0,
    "frameDy": 0,
    "model": [
      "(revive:eval)",
      "undefined"
    ],
    "src": "img/clothes/lower/shorts/tattered_gray.png",
    "masksrc": [
      "img/clothes/masks/soft_shadow.png"
    ],
    "filters": [
      "worn_lower"
    ],
    "worn": {
      "slot": "lower",
      "integrity": "tattered",
      "alt": [
        "(revive:eval)",
        "undefined"
      ],
      "index": 5
    },
    "scale": true,
    "frames": [
      0
    ],
    "maskOffsets": [],
    "maskOptions": {
      "convert": false
    },
    "image": {},
    "imageSrc": "img/clothes/lower/shorts/tattered_gray.png",
    "cachedProcessing": "{\\"src\\":\\"img/clothes/lower/shorts/tattered_gray.png\\",\\"blend\\":\\"#703000\\",\\"blendMode\\":\\"hard-light\\",\\"desaturate\\":false,\\"brightness\\":-0.4,\\"contrast\\":1,\\"prefilter\\":[\\"(revive:eval)\\",\\"undefined\\"],\\"masksrc\\":[\\"img/clothes/masks/soft_shadow.png\\"]}",
    "cachedImage": {},
    "mask": [
      {}
    ],
    "cachedMaskSrc": "[Circular]"
  },
  {
    "animation": "idle",
    "alphafn": [
      "(revive:eval)",
      "(alphafn(options) {
            return options.worn[slot].alpha;
        })"
    ],
    "wornfn": [
      "(revive:eval)",
      "(wornfn(options) {
            return {
                slot,
                integrity: options.worn[slot].integrity,
                alt: options.worn[slot].alt,
                index: options.worn[slot].setup.index
            }
        })"
    ],
    "z": 150,
    "filtersfn": [
      "(revive:eval)",
      "(filtersfn(options) {
            const altFilterSwap = !options.alt_override
                && options.worn[slot].setup.altposition !== undefined
                && options.worn[slot].alt === \'alt\'
                && options.worn[slot].setup.altdisabled.includes(\'filter\');
            return altFilterSwap ? [`worn_${slot}_acc`] : [`worn_${slot}`];
        })"
    ],
    "showfn": [
      "(revive:eval)",
      "(showfn(options) {
                return options.show_clothes
                    && options.worn.head.index > 0
                    && options.worn.head.setup.mainImage !== 0
                    && !options.hideAll;
            })"
    ],
    "srcfn": [
      "(revive:eval)",
      "(srcfn(options) {
                const dmg = options.worn.head.setup.accessory_integrity_img ? options.worn.upper.integrity : options.worn.head.integrity;
                const pattern = options.worn.head.pattern && ![\\"tertiary\\", \\"secondary\\"].includes(options.worn.head.setup.pattern_layer) ? \\"_\\" + options.worn.head.pattern?.replace(/ /g,\\"_\\") : \'\';

                const path = `img/clothes/head/${options.worn.head.setup.variable}/${dmg}${pattern}.png`;
                return gray_suffix(path, options.filters[\'worn_head\']);
            })"
    ],
    "name": "head",
    "show": true,
    "brightness": 0,
    "contrast": 1,
    "blend": "#ffffff",
    "blendMode": "hard-light",
    "maskBlendMode": "destination-in",
    "alpha": 1,
    "desaturate": false,
    "defaultOptions": {
      "animation": "idle",
      "alphafn": [
        "(revive:eval)",
        "(alphafn(options) {
            return options.worn[slot].alpha;
        })"
      ],
      "wornfn": [
        "(revive:eval)",
        "(wornfn(options) {
            return {
                slot,
                integrity: options.worn[slot].integrity,
                alt: options.worn[slot].alt,
                index: options.worn[slot].setup.index
            }
        })"
      ],
      "z": 150,
      "filtersfn": [
        "(revive:eval)",
        "(filtersfn(options) {
            const altFilterSwap = !options.alt_override
                && options.worn[slot].setup.altposition !== undefined
                && options.worn[slot].alt === \'alt\'
                && options.worn[slot].setup.altdisabled.includes(\'filter\');
            return altFilterSwap ? [`worn_${slot}_acc`] : [`worn_${slot}`];
        })"
      ],
      "showfn": [
        "(revive:eval)",
        "(showfn(options) {
                return options.show_clothes
                    && options.worn.head.index > 0
                    && options.worn.head.setup.mainImage !== 0
                    && !options.hideAll;
            })"
      ],
      "srcfn": [
        "(revive:eval)",
        "(srcfn(options) {
                const dmg = options.worn.head.setup.accessory_integrity_img ? options.worn.upper.integrity : options.worn.head.integrity;
                const pattern = options.worn.head.pattern && ![\\"tertiary\\", \\"secondary\\"].includes(options.worn.head.setup.pattern_layer) ? \\"_\\" + options.worn.head.pattern?.replace(/ /g,\\"_\\") : \'\';

                const path = `img/clothes/head/${options.worn.head.setup.variable}/${dmg}${pattern}.png`;
                return gray_suffix(path, options.filters[\'worn_head\']);
            })"
      ],
      "name": "head",
      "show": false,
      "brightness": 0,
      "contrast": 1,
      "blend": "",
      "blendMode": "",
      "maskBlendMode": "destination-in",
      "alpha": 1,
      "desaturate": false
    },
    "frameDx": 0,
    "frameDy": 0,
    "model": [
      "(revive:eval)",
      "undefined"
    ],
    "src": "img/clothes/head/beanie/full_gray.png",
    "filters": [
      "worn_head"
    ],
    "worn": {
      "slot": "head",
      "integrity": "full",
      "alt": [
        "(revive:eval)",
        "undefined"
      ],
      "index": 2
    },
    "scale": true,
    "frames": [
      0
    ],
    "maskOffsets": [],
    "maskOptions": {
      "convert": false
    },
    "image": {},
    "imageSrc": "img/clothes/head/beanie/full_gray.png",
    "cachedProcessing": "{\\"src\\":\\"img/clothes/head/beanie/full_gray.png\\",\\"blend\\":\\"#ffffff\\",\\"blendMode\\":\\"hard-light\\",\\"desaturate\\":false,\\"brightness\\":0,\\"contrast\\":1,\\"prefilter\\":[\\"(revive:eval)\\",\\"undefined\\"],\\"masksrc\\":[\\"(revive:eval)\\",\\"undefined\\"]}",
    "cachedImage": {}
  },
  {
    "animation": "idle",
    "alphafn": [
      "(revive:eval)",
      "(alphafn(options) {
            return options.worn[slot].alpha;
        })"
    ],
    "wornfn": [
      "(revive:eval)",
      "(wornfn(options) {
            return {
                slot,
                integrity: options.worn[slot].integrity,
                alt: options.worn[slot].alt,
                index: options.worn[slot].setup.index
            }
        })"
    ],
    "z": 145,
    "filtersfn": [
      "(revive:eval)",
      "(filtersfn(options) {
            const altFilterSwap = !options.alt_override
                && options.worn[slot].setup.altposition !== undefined
                && options.worn[slot].alt === \'alt\'
                && options.worn[slot].setup.altdisabled.includes(\'filter\');
            return altFilterSwap ? [`worn_${slot}_acc`] : [`worn_${slot}`];
        })"
    ],
    "showfn": [
      "(revive:eval)",
      "(showfn(options) {
            return options.show_clothes
                && options.worn[slot].index > 0
                && options.worn[slot].setup.mainImage !== 0;
        })"
    ],
    "srcfn": [
      "(revive:eval)",
      "(srcfn(options) {
            const setup = options.worn[slot].setup;

            const isHoodDown = options.hood_down
                && setup.hoodposition !== undefined
                && setup.outfitPrimary.head !== undefined;
            const isAltPosition = !options.alt_override && setup.altposition !== undefined
                && options.worn[slot].alt === \\"alt\\"
                && !setup.altdisabled.includes(\\"full\\");

            const pattern = options.worn[slot].pattern && ![\\"secondary\\", \\"tertiary\\"].includes(options.worn[slot].setup.pattern_layer) ? \\"_\\" + options.worn[slot].pattern?.replace(/ /g,\\"_\\") : \'\';

            const end = isHoodDown ? \'_down\' : isAltPosition ? \'_alt\' : \'\';
            const path = `img/clothes/${slot}/${setup.variable}/${options.worn[slot].integrity}${pattern}${end}.png`;
            return gray_suffix(path, options.filters[`worn_${slot}`]);
        })"
    ],
    "zfn": [
      "(revive:eval)",
      "(zfn(options) {
                const isAltPosition = !options.alt_override
                    && options.worn.face.setup.altposition !== undefined
                    && options.worn.face.alt === \\"alt\\";
                const check = isAltPosition
                    && (options.worn.face.setup.type.includes(\\"cool\\")
                        || options.worn.face.setup.type.includes(\\"glasses\\"));

                if (check) return ZIndices.over_head;
                return options.facewear_layer === \\"front\\" ? ZIndices.facewear - 12.5 : ZIndices.facewear;
            })"
    ],
    "name": "face",
    "show": true,
    "brightness": 0,
    "contrast": 1,
    "blend": "#353535",
    "blendMode": "hard-light",
    "maskBlendMode": "destination-in",
    "alpha": 1,
    "desaturate": false,
    "defaultOptions": {
      "animation": "idle",
      "alphafn": [
        "(revive:eval)",
        "(alphafn(options) {
            return options.worn[slot].alpha;
        })"
      ],
      "wornfn": [
        "(revive:eval)",
        "(wornfn(options) {
            return {
                slot,
                integrity: options.worn[slot].integrity,
                alt: options.worn[slot].alt,
                index: options.worn[slot].setup.index
            }
        })"
      ],
      "z": [
        "(revive:eval)",
        "undefined"
      ],
      "filtersfn": [
        "(revive:eval)",
        "(filtersfn(options) {
            const altFilterSwap = !options.alt_override
                && options.worn[slot].setup.altposition !== undefined
                && options.worn[slot].alt === \'alt\'
                && options.worn[slot].setup.altdisabled.includes(\'filter\');
            return altFilterSwap ? [`worn_${slot}_acc`] : [`worn_${slot}`];
        })"
      ],
      "showfn": [
        "(revive:eval)",
        "(showfn(options) {
            return options.show_clothes
                && options.worn[slot].index > 0
                && options.worn[slot].setup.mainImage !== 0;
        })"
      ],
      "srcfn": [
        "(revive:eval)",
        "(srcfn(options) {
            const setup = options.worn[slot].setup;

            const isHoodDown = options.hood_down
                && setup.hoodposition !== undefined
                && setup.outfitPrimary.head !== undefined;
            const isAltPosition = !options.alt_override && setup.altposition !== undefined
                && options.worn[slot].alt === \\"alt\\"
                && !setup.altdisabled.includes(\\"full\\");

            const pattern = options.worn[slot].pattern && ![\\"secondary\\", \\"tertiary\\"].includes(options.worn[slot].setup.pattern_layer) ? \\"_\\" + options.worn[slot].pattern?.replace(/ /g,\\"_\\") : \'\';

            const end = isHoodDown ? \'_down\' : isAltPosition ? \'_alt\' : \'\';
            const path = `img/clothes/${slot}/${setup.variable}/${options.worn[slot].integrity}${pattern}${end}.png`;
            return gray_suffix(path, options.filters[`worn_${slot}`]);
        })"
      ],
      "zfn": [
        "(revive:eval)",
        "(zfn(options) {
                const isAltPosition = !options.alt_override
                    && options.worn.face.setup.altposition !== undefined
                    && options.worn.face.alt === \\"alt\\";
                const check = isAltPosition
                    && (options.worn.face.setup.type.includes(\\"cool\\")
                        || options.worn.face.setup.type.includes(\\"glasses\\"));

                if (check) return ZIndices.over_head;
                return options.facewear_layer === \\"front\\" ? ZIndices.facewear - 12.5 : ZIndices.facewear;
            })"
      ],
      "name": "face",
      "show": false,
      "brightness": 0,
      "contrast": 1,
      "blend": "",
      "blendMode": "",
      "maskBlendMode": "destination-in",
      "alpha": 1,
      "desaturate": false
    },
    "frameDx": 0,
    "frameDy": 0,
    "model": [
      "(revive:eval)",
      "undefined"
    ],
    "src": "img/clothes/face/surgicalmask/full_gray.png",
    "filters": [
      "worn_face"
    ],
    "worn": {
      "slot": "face",
      "integrity": "full",
      "alt": [
        "(revive:eval)",
        "undefined"
      ],
      "index": 3
    },
    "scale": true,
    "frames": [
      0
    ],
    "maskOffsets": [],
    "maskOptions": {
      "convert": false
    },
    "image": {},
    "imageSrc": "img/clothes/face/surgicalmask/full_gray.png",
    "cachedProcessing": "{\\"src\\":\\"img/clothes/face/surgicalmask/full_gray.png\\",\\"blend\\":\\"#353535\\",\\"blendMode\\":\\"hard-light\\",\\"desaturate\\":false,\\"brightness\\":0,\\"contrast\\":1,\\"prefilter\\":[\\"(revive:eval)\\",\\"undefined\\"],\\"masksrc\\":[\\"(revive:eval)\\",\\"undefined\\"]}",
    "cachedImage": {}
  },
  {
    "animation": "idle",
    "alphafn": [
      "(revive:eval)",
      "(alphafn(options) {
            return options.worn[slot].alpha;
        })"
    ],
    "wornfn": [
      "(revive:eval)",
      "(wornfn(options) {
            return {
                slot,
                integrity: options.worn[slot].integrity,
                alt: options.worn[slot].alt,
                index: options.worn[slot].setup.index
            }
        })"
    ],
    "z": 103,
    "filtersfn": [
      "(revive:eval)",
      "(filtersfn(options) {
            const altFilterSwap = !options.alt_override
                && options.worn[slot].setup.altposition !== undefined
                && options.worn[slot].alt === \'alt\'
                && options.worn[slot].setup.altdisabled.includes(\'filter\');
            return altFilterSwap ? [`worn_${slot}_acc`] : [`worn_${slot}`];
        })"
    ],
    "showfn": [
      "(revive:eval)",
      "(showfn(options) {
                return options.show_clothes
                    && options.worn.neck.index > 0
                    && options.worn.neck.setup.mainImage !== 0
                    && !options.hideAll;
            })"
    ],
    "srcfn": [
      "(revive:eval)",
      "(srcfn(options) {
                const isAltPosition = !options.alt_override
                    && options.worn.neck.setup.altposition !== undefined
                    && options.worn.neck.alt === \\"alt\\";

                let collar = \\"\\";
                if (options.worn.neck.setup.has_collar === 1 && options.worn.upper.setup.has_collar === 1 && !(options.worn.upper.setup.name === \\"dress shirt\\" && options.worn.upper.alt === \\"alt\\")) {
                    collar = \'_nocollar\';
                } else if (options.worn.neck.setup.name === \\"sailor ribbon\\" && options.worn.upper.setup.name === \\"serafuku\\") {
                    collar = \\"_serafuku\\";
                }
                const pattern = options.worn.neck.pattern && ![\\"tertiary\\", \\"secondary\\"].includes(options.worn.neck.pattern_layer) ? \\"_\\" + options.worn.neck.pattern?.replace(/ /g,\\"_\\") : \'\';
                const alt = isAltPosition ? \'_alt\' : \'\';

                const setupVar = options.worn.neck.setup.variable;
                const integrity = options.worn.neck.integrity;
                const path = `img/clothes/neck/${setupVar}/${integrity}${collar}${pattern}${alt}.png`;
                return gray_suffix(path, options.filters[\'worn_neck\']);
            })"
    ],
    "masksrcfn": [
      "(revive:eval)",
      "(masksrcfn(options) {
                return options.high_waist_suspenders ? \\"img/clothes/neck/suspenders/mask.png\\" : null;
            })"
    ],
    "zfn": [
      "(revive:eval)",
      "(zfn(options) {
                return options.hood_mask ? ZIndices.collar : ZIndices.neck;
            })"
    ],
    "name": "neck",
    "show": true,
    "brightness": 0,
    "contrast": 1,
    "blend": "",
    "blendMode": "",
    "maskBlendMode": "destination-in",
    "alpha": 1,
    "desaturate": false,
    "defaultOptions": {
      "animation": "idle",
      "alphafn": [
        "(revive:eval)",
        "(alphafn(options) {
            return options.worn[slot].alpha;
        })"
      ],
      "wornfn": [
        "(revive:eval)",
        "(wornfn(options) {
            return {
                slot,
                integrity: options.worn[slot].integrity,
                alt: options.worn[slot].alt,
                index: options.worn[slot].setup.index
            }
        })"
      ],
      "z": 103,
      "filtersfn": [
        "(revive:eval)",
        "(filtersfn(options) {
            const altFilterSwap = !options.alt_override
                && options.worn[slot].setup.altposition !== undefined
                && options.worn[slot].alt === \'alt\'
                && options.worn[slot].setup.altdisabled.includes(\'filter\');
            return altFilterSwap ? [`worn_${slot}_acc`] : [`worn_${slot}`];
        })"
      ],
      "showfn": [
        "(revive:eval)",
        "(showfn(options) {
                return options.show_clothes
                    && options.worn.neck.index > 0
                    && options.worn.neck.setup.mainImage !== 0
                    && !options.hideAll;
            })"
      ],
      "srcfn": [
        "(revive:eval)",
        "(srcfn(options) {
                const isAltPosition = !options.alt_override
                    && options.worn.neck.setup.altposition !== undefined
                    && options.worn.neck.alt === \\"alt\\";

                let collar = \\"\\";
                if (options.worn.neck.setup.has_collar === 1 && options.worn.upper.setup.has_collar === 1 && !(options.worn.upper.setup.name === \\"dress shirt\\" && options.worn.upper.alt === \\"alt\\")) {
                    collar = \'_nocollar\';
                } else if (options.worn.neck.setup.name === \\"sailor ribbon\\" && options.worn.upper.setup.name === \\"serafuku\\") {
                    collar = \\"_serafuku\\";
                }
                const pattern = options.worn.neck.pattern && ![\\"tertiary\\", \\"secondary\\"].includes(options.worn.neck.pattern_layer) ? \\"_\\" + options.worn.neck.pattern?.replace(/ /g,\\"_\\") : \'\';
                const alt = isAltPosition ? \'_alt\' : \'\';

                const setupVar = options.worn.neck.setup.variable;
                const integrity = options.worn.neck.integrity;
                const path = `img/clothes/neck/${setupVar}/${integrity}${collar}${pattern}${alt}.png`;
                return gray_suffix(path, options.filters[\'worn_neck\']);
            })"
      ],
      "masksrcfn": [
        "(revive:eval)",
        "(masksrcfn(options) {
                return options.high_waist_suspenders ? \\"img/clothes/neck/suspenders/mask.png\\" : null;
            })"
      ],
      "zfn": [
        "(revive:eval)",
        "(zfn(options) {
                return options.hood_mask ? ZIndices.collar : ZIndices.neck;
            })"
      ],
      "name": "neck",
      "show": false,
      "brightness": 0,
      "contrast": 1,
      "blend": "",
      "blendMode": "",
      "maskBlendMode": "destination-in",
      "alpha": 1,
      "desaturate": false
    },
    "frameDx": 0,
    "frameDy": 0,
    "model": [
      "(revive:eval)",
      "undefined"
    ],
    "src": "img/clothes/neck/collarleash/full.png",
    "masksrc": null,
    "filters": [
      "worn_neck"
    ],
    "worn": {
      "slot": "neck",
      "integrity": "full",
      "alt": [
        "(revive:eval)",
        "undefined"
      ],
      "index": 21
    },
    "scale": true,
    "frames": [
      0
    ],
    "maskOffsets": [],
    "maskOptions": {
      "convert": false
    },
    "image": {},
    "imageSrc": "img/clothes/neck/collarleash/full.png",
    "cachedProcessing": "{\\"src\\":\\"img/clothes/neck/collarleash/full.png\\",\\"blend\\":\\"\\",\\"blendMode\\":\\"\\",\\"desaturate\\":false,\\"brightness\\":0,\\"contrast\\":1,\\"prefilter\\":[\\"(revive:eval)\\",\\"undefined\\"],\\"masksrc\\":null}",
    "cachedImage": {}
  },
  {
    "animation": "idle",
    "alphafn": [
      "(revive:eval)",
      "(alphafn(options) {
            return options.worn[slot].alpha;
        })"
    ],
    "wornfn": [
      "(revive:eval)",
      "(wornfn(options) {
            return {
                slot,
                integrity: options.worn[slot].integrity,
                alt: options.worn[slot].alt,
                index: options.worn[slot].setup.index
            }
        })"
    ],
    "z": 103,
    "filtersfn": [
      "(revive:eval)",
      "(filtersfn(options) {
            const altFilterSwap = !options.alt_override
                && options.worn[slot].setup.altposition !== undefined
                && options.worn[slot].alt === \'alt\'
                && options.worn[slot].setup.altdisabled.includes(\'filter\');
            return altFilterSwap ? [`worn_${slot}`] : [`worn_${slot}_acc`];
        })"
    ],
    "showfn": [
      "(revive:eval)",
      "(showfn(options) {
                return options.show_clothes
                    && options.worn.neck.index > 0
                    && options.worn.neck.setup.accImage !== 0
                    && options.worn.neck.setup.accessory === 1
                    && !options.hideLeash;
            })"
    ],
    "srcfn": [
      "(revive:eval)",
      "(srcfn(options) {
                const isAltPosition = !options.alt_override
                    && options.worn.neck.setup.altposition !== undefined
                    && options.worn.neck.alt === \\"alt\\";
                const integrity = options.worn.neck.setup.accessory_integrity_img ? `_${options.worn.neck.integrity}` : \'\';
                const alt = isAltPosition ? \'_alt\' : \'\';
                const pattern = options.worn.neck?.pattern && options.worn.neck?.pattern_layer === \\"secondary\\" ? \\"_\\" + options.worn.neck.pattern?.replace(/ /g,\\"_\\") : \'\';

                const setupVar = options.worn.neck.setup.variable;
                const path = `img/clothes/neck/${setupVar}/acc${integrity}${pattern}${alt}.png`;
                return gray_suffix(path, options.filters[\'worn_neck_acc\']);
            })"
    ],
    "zfn": [
      "(revive:eval)",
      "(zfn(options) {
                const check = options.worn.head.setup.mask_img === 1
                    && !(options.hood_down
                        && options.worn.head.setup.hood
                        && options.worn.head.setup.outfitSecondary !== undefined);
                return check ? ZIndices.collar : ZIndices.neck;
            })"
    ],
    "dyfn": [
      "(revive:eval)",
      "(dyfn(options) {
                return options.high_waist_suspenders ? -8 : 0;
            })"
    ],
    "name": "neck_acc",
    "show": true,
    "brightness": 0,
    "contrast": 1,
    "blend": "",
    "blendMode": "",
    "maskBlendMode": "destination-in",
    "alpha": 1,
    "desaturate": false,
    "defaultOptions": {
      "animation": "idle",
      "alphafn": [
        "(revive:eval)",
        "(alphafn(options) {
            return options.worn[slot].alpha;
        })"
      ],
      "wornfn": [
        "(revive:eval)",
        "(wornfn(options) {
            return {
                slot,
                integrity: options.worn[slot].integrity,
                alt: options.worn[slot].alt,
                index: options.worn[slot].setup.index
            }
        })"
      ],
      "z": 103,
      "filtersfn": [
        "(revive:eval)",
        "(filtersfn(options) {
            const altFilterSwap = !options.alt_override
                && options.worn[slot].setup.altposition !== undefined
                && options.worn[slot].alt === \'alt\'
                && options.worn[slot].setup.altdisabled.includes(\'filter\');
            return altFilterSwap ? [`worn_${slot}`] : [`worn_${slot}_acc`];
        })"
      ],
      "showfn": [
        "(revive:eval)",
        "(showfn(options) {
                return options.show_clothes
                    && options.worn.neck.index > 0
                    && options.worn.neck.setup.accImage !== 0
                    && options.worn.neck.setup.accessory === 1
                    && !options.hideLeash;
            })"
      ],
      "srcfn": [
        "(revive:eval)",
        "(srcfn(options) {
                const isAltPosition = !options.alt_override
                    && options.worn.neck.setup.altposition !== undefined
                    && options.worn.neck.alt === \\"alt\\";
                const integrity = options.worn.neck.setup.accessory_integrity_img ? `_${options.worn.neck.integrity}` : \'\';
                const alt = isAltPosition ? \'_alt\' : \'\';
                const pattern = options.worn.neck?.pattern && options.worn.neck?.pattern_layer === \\"secondary\\" ? \\"_\\" + options.worn.neck.pattern?.replace(/ /g,\\"_\\") : \'\';

                const setupVar = options.worn.neck.setup.variable;
                const path = `img/clothes/neck/${setupVar}/acc${integrity}${pattern}${alt}.png`;
                return gray_suffix(path, options.filters[\'worn_neck_acc\']);
            })"
      ],
      "zfn": [
        "(revive:eval)",
        "(zfn(options) {
                const check = options.worn.head.setup.mask_img === 1
                    && !(options.hood_down
                        && options.worn.head.setup.hood
                        && options.worn.head.setup.outfitSecondary !== undefined);
                return check ? ZIndices.collar : ZIndices.neck;
            })"
      ],
      "dyfn": [
        "(revive:eval)",
        "(dyfn(options) {
                return options.high_waist_suspenders ? -8 : 0;
            })"
      ],
      "name": "neck_acc",
      "show": false,
      "brightness": 0,
      "contrast": 1,
      "blend": "",
      "blendMode": "",
      "maskBlendMode": "destination-in",
      "alpha": 1,
      "desaturate": false
    },
    "frameDx": 0,
    "frameDy": 0,
    "model": [
      "(revive:eval)",
      "undefined"
    ],
    "src": "img/clothes/neck/collarleash/acc.png",
    "filters": [
      "worn_neck_acc"
    ],
    "dy": 0,
    "worn": {
      "slot": "neck",
      "integrity": "full",
      "alt": [
        "(revive:eval)",
        "undefined"
      ],
      "index": 21
    },
    "scale": true,
    "frames": [
      0
    ],
    "maskOffsets": [],
    "maskOptions": {
      "convert": false
    },
    "image": {},
    "imageSrc": "img/clothes/neck/collarleash/acc.png",
    "cachedProcessing": "{\\"src\\":\\"img/clothes/neck/collarleash/acc.png\\",\\"blend\\":\\"\\",\\"blendMode\\":\\"\\",\\"desaturate\\":false,\\"brightness\\":0,\\"contrast\\":1,\\"prefilter\\":[\\"(revive:eval)\\",\\"undefined\\"],\\"masksrc\\":[\\"(revive:eval)\\",\\"undefined\\"]}",
    "cachedImage": {}
  },
  {
    "animation": "idle",
    "alphafn": [
      "(revive:eval)",
      "(alphafn(options) {
            return options.worn[slot].alpha;
        })"
    ],
    "wornfn": [
      "(revive:eval)",
      "(wornfn(options) {
            return {
                slot,
                integrity: options.worn[slot].integrity,
                alt: options.worn[slot].alt,
                index: options.worn[slot].setup.index
            }
        })"
    ],
    "z": 67.6,
    "filtersfn": [
      "(revive:eval)",
      "(filtersfn(options) {
            const altFilterSwap = !options.alt_override
                && options.worn[slot].setup.altposition !== undefined
                && options.worn[slot].alt === \'alt\'
                && options.worn[slot].setup.altdisabled.includes(\'filter\');
            return altFilterSwap ? [`worn_${slot}_acc`] : [`worn_${slot}`];
        })"
    ],
    "showfn": [
      "(revive:eval)",
      "(showfn(options) {
            return options.show_clothes
                && options.worn[slot].index > 0
                && options.worn[slot].setup.mainImage !== 0;
        })"
    ],
    "srcfn": [
      "(revive:eval)",
      "(srcfn(options) {
            const setup = options.worn[slot].setup;

            const isHoodDown = options.hood_down
                && setup.hoodposition !== undefined
                && setup.outfitPrimary.head !== undefined;
            const isAltPosition = !options.alt_override && setup.altposition !== undefined
                && options.worn[slot].alt === \\"alt\\"
                && !setup.altdisabled.includes(\\"full\\");

            const pattern = options.worn[slot].pattern && ![\\"secondary\\", \\"tertiary\\"].includes(options.worn[slot].setup.pattern_layer) ? \\"_\\" + options.worn[slot].pattern?.replace(/ /g,\\"_\\") : \'\';

            const end = isHoodDown ? \'_down\' : isAltPosition ? \'_alt\' : \'\';
            const path = `img/clothes/${slot}/${setup.variable}/${options.worn[slot].integrity}${pattern}${end}.png`;
            return gray_suffix(path, options.filters[`worn_${slot}`]);
        })"
    ],
    "zfn": [
      "(revive:eval)",
      "(zfn(options) {
                const check = (options.worn.under_lower.setup.set === options.worn.under_upper.setup.set
                    || options.worn.under_lower.setup.high_img === 1) && options.worn.legs.setup.high_img !== 1;

                if (check) return ZIndices.legs;
                return ZIndices.legs_high;
            })"
    ],
    "masksrcfn": [
      "(revive:eval)",
      "(masksrcfn(options) {
                return options.legsMask;
            })"
    ],
    "name": "legs",
    "show": true,
    "brightness": 0,
    "contrast": 1,
    "blend": "#ffffff",
    "blendMode": "hard-light",
    "maskBlendMode": "destination-in",
    "alpha": 1,
    "desaturate": false,
    "defaultOptions": {
      "animation": "idle",
      "alphafn": [
        "(revive:eval)",
        "(alphafn(options) {
            return options.worn[slot].alpha;
        })"
      ],
      "wornfn": [
        "(revive:eval)",
        "(wornfn(options) {
            return {
                slot,
                integrity: options.worn[slot].integrity,
                alt: options.worn[slot].alt,
                index: options.worn[slot].setup.index
            }
        })"
      ],
      "z": 66.6,
      "filtersfn": [
        "(revive:eval)",
        "(filtersfn(options) {
            const altFilterSwap = !options.alt_override
                && options.worn[slot].setup.altposition !== undefined
                && options.worn[slot].alt === \'alt\'
                && options.worn[slot].setup.altdisabled.includes(\'filter\');
            return altFilterSwap ? [`worn_${slot}_acc`] : [`worn_${slot}`];
        })"
      ],
      "showfn": [
        "(revive:eval)",
        "(showfn(options) {
            return options.show_clothes
                && options.worn[slot].index > 0
                && options.worn[slot].setup.mainImage !== 0;
        })"
      ],
      "srcfn": [
        "(revive:eval)",
        "(srcfn(options) {
            const setup = options.worn[slot].setup;

            const isHoodDown = options.hood_down
                && setup.hoodposition !== undefined
                && setup.outfitPrimary.head !== undefined;
            const isAltPosition = !options.alt_override && setup.altposition !== undefined
                && options.worn[slot].alt === \\"alt\\"
                && !setup.altdisabled.includes(\\"full\\");

            const pattern = options.worn[slot].pattern && ![\\"secondary\\", \\"tertiary\\"].includes(options.worn[slot].setup.pattern_layer) ? \\"_\\" + options.worn[slot].pattern?.replace(/ /g,\\"_\\") : \'\';

            const end = isHoodDown ? \'_down\' : isAltPosition ? \'_alt\' : \'\';
            const path = `img/clothes/${slot}/${setup.variable}/${options.worn[slot].integrity}${pattern}${end}.png`;
            return gray_suffix(path, options.filters[`worn_${slot}`]);
        })"
      ],
      "zfn": [
        "(revive:eval)",
        "(zfn(options) {
                const check = (options.worn.under_lower.setup.set === options.worn.under_upper.setup.set
                    || options.worn.under_lower.setup.high_img === 1) && options.worn.legs.setup.high_img !== 1;

                if (check) return ZIndices.legs;
                return ZIndices.legs_high;
            })"
      ],
      "masksrcfn": [
        "(revive:eval)",
        "(masksrcfn(options) {
                return options.legsMask;
            })"
      ],
      "name": "legs",
      "show": false,
      "brightness": 0,
      "contrast": 1,
      "blend": "",
      "blendMode": "",
      "maskBlendMode": "destination-in",
      "alpha": 1,
      "desaturate": false
    },
    "frameDx": 0,
    "frameDy": 0,
    "model": [
      "(revive:eval)",
      "undefined"
    ],
    "src": "img/clothes/legs/striped socks long/full_gray.png",
    "masksrc": [
      "img/clothes/masks/soft_lower_clip.png",
      "img/clothes/feet/field/mask.png"
    ],
    "filters": [
      "worn_legs"
    ],
    "worn": {
      "slot": "legs",
      "integrity": "full",
      "alt": [
        "(revive:eval)",
        "undefined"
      ],
      "index": 22
    },
    "scale": true,
    "frames": [
      0
    ],
    "maskOffsets": [],
    "maskOptions": {
      "convert": false
    },
    "image": {},
    "imageSrc": "img/clothes/legs/striped socks long/full_gray.png",
    "cachedProcessing": "{\\"src\\":\\"img/clothes/legs/striped socks long/full_gray.png\\",\\"blend\\":\\"#ffffff\\",\\"blendMode\\":\\"hard-light\\",\\"desaturate\\":false,\\"brightness\\":0,\\"contrast\\":1,\\"prefilter\\":[\\"(revive:eval)\\",\\"undefined\\"],\\"masksrc\\":[\\"img/clothes/masks/soft_lower_clip.png\\",\\"img/clothes/feet/field/mask.png\\"]}",
    "cachedImage": {},
    "mask": [
      "[Circular]",
      {}
    ],
    "cachedMaskSrc": "[Circular]"
  },
  {
    "animation": "idle",
    "alphafn": [
      "(revive:eval)",
      "(alphafn(options) {
            return options.worn[slot].alpha;
        })"
    ],
    "wornfn": [
      "(revive:eval)",
      "(wornfn(options) {
            return {
                slot,
                integrity: options.worn[slot].integrity,
                alt: options.worn[slot].alt,
                index: options.worn[slot].setup.index
            }
        })"
    ],
    "z": 85,
    "filtersfn": [
      "(revive:eval)",
      "(filtersfn(options) {
            const altFilterSwap = !options.alt_override
                && options.worn[slot].setup.altposition !== undefined
                && options.worn[slot].alt === \'alt\'
                && options.worn[slot].setup.altdisabled.includes(\'filter\');
            return altFilterSwap ? [`worn_${slot}_acc`] : [`worn_${slot}`];
        })"
    ],
    "showfn": [
      "(revive:eval)",
      "(showfn(options) {
            return options.show_clothes
                && options.worn[slot].index > 0
                && options.worn[slot].setup.mainImage !== 0;
        })"
    ],
    "srcfn": [
      "(revive:eval)",
      "(srcfn(options) {
            const setup = options.worn[slot].setup;

            const isHoodDown = options.hood_down
                && setup.hoodposition !== undefined
                && setup.outfitPrimary.head !== undefined;
            const isAltPosition = !options.alt_override && setup.altposition !== undefined
                && options.worn[slot].alt === \\"alt\\"
                && !setup.altdisabled.includes(\\"full\\");

            const pattern = options.worn[slot].pattern && ![\\"secondary\\", \\"tertiary\\"].includes(options.worn[slot].setup.pattern_layer) ? \\"_\\" + options.worn[slot].pattern?.replace(/ /g,\\"_\\") : \'\';

            const end = isHoodDown ? \'_down\' : isAltPosition ? \'_alt\' : \'\';
            const path = `img/clothes/${slot}/${setup.variable}/${options.worn[slot].integrity}${pattern}${end}.png`;
            return gray_suffix(path, options.filters[`worn_${slot}`]);
        })"
    ],
    "zfn": [
      "(revive:eval)",
      "(zfn(options) {
                const check = options.lower_tucked
                    && !options.worn.lower.setup.notuck
                    && !options.worn.feet.setup.notuck;

                if (check) return ZIndices.lower_tucked_feet;
                return ZIndices.feet;
            })"
    ],
    "name": "feet",
    "show": true,
    "brightness": 0,
    "contrast": 1,
    "blend": "",
    "blendMode": "",
    "maskBlendMode": "destination-in",
    "alpha": 1,
    "desaturate": false,
    "defaultOptions": {
      "animation": "idle",
      "alphafn": [
        "(revive:eval)",
        "(alphafn(options) {
            return options.worn[slot].alpha;
        })"
      ],
      "wornfn": [
        "(revive:eval)",
        "(wornfn(options) {
            return {
                slot,
                integrity: options.worn[slot].integrity,
                alt: options.worn[slot].alt,
                index: options.worn[slot].setup.index
            }
        })"
      ],
      "z": 85,
      "filtersfn": [
        "(revive:eval)",
        "(filtersfn(options) {
            const altFilterSwap = !options.alt_override
                && options.worn[slot].setup.altposition !== undefined
                && options.worn[slot].alt === \'alt\'
                && options.worn[slot].setup.altdisabled.includes(\'filter\');
            return altFilterSwap ? [`worn_${slot}_acc`] : [`worn_${slot}`];
        })"
      ],
      "showfn": [
        "(revive:eval)",
        "(showfn(options) {
            return options.show_clothes
                && options.worn[slot].index > 0
                && options.worn[slot].setup.mainImage !== 0;
        })"
      ],
      "srcfn": [
        "(revive:eval)",
        "(srcfn(options) {
            const setup = options.worn[slot].setup;

            const isHoodDown = options.hood_down
                && setup.hoodposition !== undefined
                && setup.outfitPrimary.head !== undefined;
            const isAltPosition = !options.alt_override && setup.altposition !== undefined
                && options.worn[slot].alt === \\"alt\\"
                && !setup.altdisabled.includes(\\"full\\");

            const pattern = options.worn[slot].pattern && ![\\"secondary\\", \\"tertiary\\"].includes(options.worn[slot].setup.pattern_layer) ? \\"_\\" + options.worn[slot].pattern?.replace(/ /g,\\"_\\") : \'\';

            const end = isHoodDown ? \'_down\' : isAltPosition ? \'_alt\' : \'\';
            const path = `img/clothes/${slot}/${setup.variable}/${options.worn[slot].integrity}${pattern}${end}.png`;
            return gray_suffix(path, options.filters[`worn_${slot}`]);
        })"
      ],
      "zfn": [
        "(revive:eval)",
        "(zfn(options) {
                const check = options.lower_tucked
                    && !options.worn.lower.setup.notuck
                    && !options.worn.feet.setup.notuck;

                if (check) return ZIndices.lower_tucked_feet;
                return ZIndices.feet;
            })"
      ],
      "name": "feet",
      "show": false,
      "brightness": 0,
      "contrast": 1,
      "blend": "",
      "blendMode": "",
      "maskBlendMode": "destination-in",
      "alpha": 1,
      "desaturate": false
    },
    "frameDx": 0,
    "frameDy": 0,
    "model": [
      "(revive:eval)",
      "undefined"
    ],
    "src": "img/clothes/feet/field/full.png",
    "filters": [
      "worn_feet"
    ],
    "worn": {
      "slot": "feet",
      "integrity": "full",
      "alt": [
        "(revive:eval)",
        "undefined"
      ],
      "index": 19
    },
    "scale": true,
    "frames": [
      0
    ],
    "maskOffsets": [],
    "maskOptions": {
      "convert": false
    },
    "image": {},
    "imageSrc": "img/clothes/feet/field/full.png",
    "cachedProcessing": "{\\"src\\":\\"img/clothes/feet/field/full.png\\",\\"blend\\":\\"\\",\\"blendMode\\":\\"\\",\\"desaturate\\":false,\\"brightness\\":0,\\"contrast\\":1,\\"prefilter\\":[\\"(revive:eval)\\",\\"undefined\\"],\\"masksrc\\":[\\"(revive:eval)\\",\\"undefined\\"]}",
    "cachedImage": {}
  }
]