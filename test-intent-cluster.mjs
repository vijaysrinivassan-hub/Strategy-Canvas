import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read = name => fs.readFileSync(new URL('./' + name, import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(read('ask-luca-keyword-import.js'), context);
vm.runInContext(read('shared-url-repository.js'), context);
vm.runInContext(read('intent-cluster.js'), context);
vm.runInContext('globalThis.CompetitiveIntelligenceClassifications={profiles:[],classifications:{}}', context);
const { IntentCluster, SharedUrlRepository: repository } = context;

const records = repository.records();
const articles = IntentCluster.writtenArticles(records, { workspace:'ai-data-platform', pageGroup:repository.pageGroup });
const expected = Object.values(context.AskLucaKeywordImport.classifications).filter(item => item.workspace === 'ai-data-platform').length;
assert.equal(articles.length, expected, 'every written AI Data Platform article is placed');
assert.ok(articles.every(item => /^https:\/\/(ask-luca\.com|content\.maximuslabs\.ai\/luca)\//.test(item.url)),'only the represented company’s own articles count as written');
assert.ok(!articles.some(item => /wayflyer/i.test(item.url)), 'the Capital Layer workspace stays out of the AI Layer cluster');

const tree = IntentCluster.buildTree(articles, { client:'AI Data Platform', competitors:['Glew / Glew.io', 'Daasity', 'Saras Analytics'] });
assert.equal(tree.children.map(node => node.label).join("|"), ['Informational', 'Commercial'].join("|"));
const [informational, commercial] = tree.children;
assert.equal(informational.children.map(node => node.label).join("|"), ['Problem Unaware', 'Problem Aware'].join("|"));
assert.equal(commercial.children.map(node => node.label).join("|"), ['Category', 'Solution Aware', 'Product Aware'].join("|"));
assert.equal(informational.total + commercial.total, articles.length, 'each article sits under exactly one intent');

const category = commercial.children[0];
const competitors = category.children.at(-1);
assert.equal(competitors.label, 'Competitors', 'Competitors branch off the Category circle');
const glew = competitors.children.find(node => node.label === 'Glew / Glew.io');
assert.ok(glew.articles.some(item => /glew-alternatives/.test(item.url)), 'matrix names collect articles written under a shorter name');
assert.ok(!competitors.children.some(node => node.label === 'Glew'), 'the same company is not listed twice');
assert.equal(competitors.children.find(node => node.label === 'Saras Analytics').total, 0, 'matrix competitors without articles still appear');
assert.ok(competitors.children.some(node => node.label === 'Supermetrics'), 'competitors with articles but no matrix row still appear');
assert.ok(category.children.some(node => node.label === 'E-commerce Data Analytics'), 'category names come from the category articles');

const product = commercial.children.find(node => node.label === 'Product Aware');
assert.ok(product.total > 0 && IntentCluster.articlesUnder(product).every(item => item.stage === 'product-aware'));

const summary = IntentCluster.stageSummary(articles);
assert.equal(summary.map(stage => stage.intent).join("|"), ['informational','informational','commercial','commercial','commercial','commercial'].join("|"));
assert.equal(summary.reduce((sum, stage) => sum + stage.total, 0), articles.length);

const collapsed = IntentCluster.layout(tree, new Set(['root']));
assert.equal(collapsed.placed.length, 3, 'collapsed cluster shows the two intent spikes');
const open = IntentCluster.layout(tree, new Set(['root','commercial','category-aware','competitor-aware']));
assert.ok(open.placed.some(spot => spot.item.label === 'Supermetrics'), 'opening Category › Competitors reveals each competitor');

const html = read('index.html');
assert.ok(html.includes("const intent = tabButton(CONTENT_TAB, 'Search Intent');"));
assert.ok(html.includes("intent.classList.add('intent-tab');"));
assert.ok(html.includes('<div id="intentPane" hidden></div>'));
assert.ok(html.includes('<script src="intent-cluster.js'));
assert.ok(html.includes("keywordIntent: state.keywordIntent || ''"));
console.log('intent cluster ok');
