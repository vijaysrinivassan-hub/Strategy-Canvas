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

// inner layer: money pages plus the very same commercial circles
const site = ['https://ask-luca.com','https://ask-luca.com/pricing','https://ask-luca.com/how-it-works','https://ask-luca.com/blog',
  'https://ask-luca.com/blog-categories/wayflyer','https://ask-luca.com/privacy','https://ask-luca.com/careers','https://ask-luca.com/blogs/ecommerce-kpis'];
const pages = IntentCluster.moneyPages(site, ['https://ask-luca.com/blogs/ecommerce-kpis']);
assert.equal(pages.map(p => p.title).join('|'), 'Home|Pricing|Ecommerce kpis|How it works', 'money pages skip blog, legal and careers pages but keep starred ones');
const inner = IntentCluster.buildInner(tree, pages, { client:'AI Data Platform' });
assert.equal(inner.children[0].label, 'Money pages');
assert.ok(inner.children.includes(category), 'the inner layer reuses the outer commercial circles, not copies');
const dual = IntentCluster.dualIds(inner);
assert.ok(dual.has('category-aware') && dual.has(glew.id), 'commercial circles are marked as in both layers');
assert.ok(!dual.has('money-pages') && !dual.has('problem-aware'), 'money and informational circles sit in one layer only');
assert.ok(inner.children[0].children.find(p => p.label === 'Ecommerce kpis').alsoArticle, 'a starred blog post is flagged as also being an article');

// topics added on the map hang under any circle, shared circles show them in both layers
const left = IntentCluster.applyTopics([tree, inner], [
  { id:'t1', parentId:'category-aware', label:'Data observability' },
  { id:'t2', parentId:'topic:t1', label:'Pipeline alerts' },
  { id:'t3', parentId:'gone', label:'Orphan' }
]);
assert.equal(left.length, 1, 'a topic whose parent disappeared is reported, not drawn');
const added = IntentCluster.find(inner, 'topic:t1');
assert.ok(added && IntentCluster.find(tree, 'topic:t1') === added, 'an added commercial topic is the same circle in both layers');
assert.equal(added.children[0].label, 'Pipeline alerts', 'topics can be added under added topics');

// radial map: centre, then one ring per level
const ring = IntentCluster.radial(tree, new Set(['root']));
assert.equal(ring.placed.length, 3, 'collapsed map shows the two intents around the centre');
assert.ok(ring.placed.slice(1).every(spot => Math.abs(Math.hypot(spot.x, spot.y) - ring.ring) < 1e-6), 'first ring sits at one ring distance');
const open = IntentCluster.radial(tree, new Set(['root','commercial','category-aware','competitor-aware']));
assert.ok(open.placed.some(spot => spot.item.label === 'Supermetrics'), 'opening Category › Competitors reveals each competitor');
assert.ok(open.links.every(link => link.b.depth === link.a.depth + 1), 'every line joins a circle to its parent');

const html = read('index.html');
assert.ok(!html.includes('Search Intent'), 'the old Search Intent tab is gone');
assert.ok(html.includes("modes.className = 'keyword-mode-switch';"));
assert.ok(html.includes("[['matrix', 'Matrix'], ['cluster', 'Cluster']]"), 'Matrix sits left of Cluster');
const tabsBlock = html.slice(html.indexOf("if (item.kind === 'keywords-tabs')"), html.indexOf("if (item.kind === 'canvas-tabs')"));
assert.ok(tabsBlock.indexOf("viewDef(viewId)") < tabsBlock.indexOf("keyword-mode-switch"), 'the switch sits below the Competitor Aware tab');
assert.ok(tabsBlock.includes("button.disabled = true;") && tabsBlock.includes("keyword-lock"), 'Cluster locks the keyword tabs instead of hiding them');
assert.ok(!tabsBlock.includes('if (cluster) return;'));
assert.ok(html.includes('function openKeywordMatrix()'));
assert.ok(html.includes('onAddCompetitor: name =>') && html.includes("matrix.rows.push({ id: uid(), name })"), 'a competitor added on the map becomes a matrix row');
assert.ok(html.includes('function intentTopics()'));
assert.ok(html.includes('<div id="intentPane" hidden></div>'));
assert.ok(html.includes("location.keywordIntent === 'cluster' ? 'cluster' : ''"));
const css = read('intent-cluster.css');
assert.ok(css.includes('.keyword-mode-switch button + button{border-left:1px solid #fff}'), 'a thin white line splits the two buttons');
assert.ok(!/marker|arrow/i.test(read('intent-cluster.js').replace(/\/\*[\s\S]*?\*\//g,'')), 'straight lines, no arrowheads');
console.log('intent cluster ok');
