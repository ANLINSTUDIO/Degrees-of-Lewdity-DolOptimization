const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

let reloads = 0;
let confirmed = false;
const context = {
    console,
    confirm: () => confirmed,
    location: { reload: () => reloads++ },
    setTimeout: callback => callback(),
    clearTimeout: () => {},
    document: { getElementById: () => null },
    window: {}
};
context.window = context;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'javascript', 'modloader-optimization.js'), 'utf8'), context);

context.dolOptShowToast = () => {};
context.dolOptOfferReload('test');
assert.equal(reloads, 0);
confirmed = true;
context.dolOptOfferReload('test');
assert.equal(reloads, 1);
assert.equal([...context.dolOptFindTextOffsets('Error error ERROR', 'error')].join(','), '0,6,12');

const container = {
    innerHTML: '',
    querySelectorAll: () => [
        { dataset: { section: 'side' }, open: false },
        { dataset: { section: 'beauty' }, open: true },
        { dataset: { section: 'core' }, open: false }
    ]
};
context.document.getElementById = id => id === 'dolOptModManageContainer' ? container : null;
context._dolOptModState = { sideEnabled: [], sideDisabled: [], builtInMods: [] };
context._dolOptBeautyState = { enabledList: [], disabledList: [], allMap: new Map() };
context.dolOptGetGui = () => ({ gModUtils: { getMod: () => ({ bootJson: {} }) } });
context.dolOptRenderBeautyUI = () => {};
context.dolOptRenderModManageUI();
assert.ok(container.innerHTML.includes('data-section="side">'));
assert.ok(container.innerHTML.includes('data-section="beauty" open>'));
assert.ok(container.innerHTML.includes('data-section="core">'));

const boots = {
    Feature: { name: 'Feature', dependenceInfo: [{ modName: 'Core' }] },
    Core: { name: 'Core' }
};
context._dolOptModState = { sideEnabled: ['Feature', 'Core'], sideDisabled: [], builtInMods: [] };
context._dolOptBeautyState = {
    enabledList: [
        { type: 'BaseArt', modRef: { name: 'Base', bootJson: { name: 'Base' } } },
        { type: 'OverlayArt', modRef: { name: 'Overlay', bootJson: { name: 'Overlay', dependenceInfo: [{ modName: 'Base' }] } } }
    ],
    disabledList: [],
    allMap: new Map()
};
let readmeReads = 0;
context.dolOptGetGui = () => ({
    getModTReadMe: async () => (++readmeReads, Promise.reject(new Error('README must not be read while sorting'))),
    gModUtils: { getMod: name => ({ bootJson: boots[name] || {} }) }
});
context.dolOptRenderModManageUI = () => {};
let modSaves = 0;
let beautySaves = 0;
let reloadOffers = 0;
context.dolOptSaveModManageState = async () => (++modSaves, true);
context.dolOptSaveBeautyState = async () => (++beautySaves, true);
context.dolOptOfferReload = () => reloadOffers++;

(async () => {
    await context.dolOptSmartSortAll();
    assert.equal([...context._dolOptModState.sideEnabled].join(','), 'Core,Feature');
    assert.equal([...context._dolOptBeautyState.enabledList].map(item => item.type).join(','), 'OverlayArt,BaseArt');
    assert.equal(modSaves, 1);
    assert.equal(beautySaves, 1);
    assert.equal(reloadOffers, 1);
    assert.equal(readmeReads, 0);

    const twee = fs.readFileSync(path.join(__dirname, 'twee', 'modloader', 'modloader.twee'), 'utf8');
    const script = fs.readFileSync(path.join(__dirname, 'javascript', 'modloader-optimization.js'), 'utf8');
    assert.ok(!twee.includes('<<button "美化管理">>'));
    assert.ok(twee.includes('<<button "Mod ReadMe">>'));
    assert.equal((script.match(/<details class="dol-opt-collapsible-section"/g) || []).length, 3);
    assert.ok(script.includes('🪄 智能整理模组与美化顺序'));
    assert.ok(!script.includes('🪄 智能整理全部'));
    assert.ok(twee.includes('id="dolOptLogSearch"'));
    assert.ok(twee.includes('id="dolOptLogErrors"'));
    console.log('1.0.89 safe smart-sort checks passed');
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
