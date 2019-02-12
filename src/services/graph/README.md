# Graph Relations
In order to make the application extensible in the future without
data modeling and code rewrites, we can leverage a graph style structure
of `Nodes` and `Relations` (aka Edges). Although it may be best to
use dedicated Graph DBs (e.g. Neo4J, Redis Graph, etc.), we can use
existing relational database and store bi-directional relations.

## Why not just relations with Postgres?
As you add millions of records, each may have dozens of relations, and eventually
performance is impacted or to render useful information requires too many JOINs.
Using a graph, allows efficient queries and only a few layers of queries to gather
all data about something.

## Potential node types and relations (helper)
 * SEE: `/src/utils/graph.helper.ts`
 * Similar to [Facebook TAO](https://www.facebook.com/notes/facebook-engineering/tao-the-power-of-the-graph/10151525983993920/)

# Writes

## Example 1: Person authors a new Post
 * `Person` (add node with `id='person-1', objectType='person', label='Sam Smith'`)
   * `AUTHORED` (relation)
     * `sourceType='person', sourceId='person-1'`
     * `targetType='post', targetId='post-1'`
     * `meta={created: '12341235234'}`
 * `Post` (add node with `id='post-1', objectType='post', text='Do you like pizza?'`)
   * `AUTHORED_BY` (relation)
     * `sourceType='post', sourceId='post-1'`
     * `targetType='person', targetId='person-1'`
     * `meta={created: '12341235234'}`

## Example 2: Person Likes a Post
 * `Person` (add node with `id='person-2', objectType='person', label='Jen Surfer'`)
   * `LIKES` (relation)
     * `sourceType='person', sourceId='person-2'`
     * `targetType='post', targetId='post-1'`
     * `meta={created: '12341239999'}`
 * `Post` (already exists)
   * `LIKED_BY` (relation)
     * `sourceType='post', sourceId='post-1'`
     * `targetType='person', targetId='person-1'`
     * `meta={created: '12341239999'}`

## Example 3: Person authors Comment on a Post
 * `Person` (already exists: 'Jen Surfer')
   * `AUTHORED` (relation)
     * `sourceType='person', sourceId='person-2'`
     * `targetType='comment', targetId='comment-1'`
     * `meta={created: '12351235223'}`
 * `Comment` (add node with `id='comment-1', objectType='comment', text='Yes I eat it every week!'`)
   * `AUTHORED_BY` (relation)
     * `sourceType='comment', sourceId='comment-1'`
     * `targetType='person', targetId='person-2'`
     * `meta={created: '12351235223'}`
   * `PART_OF` (relation)
     * `sourceType='comment', sourceId='comment-1'`
     * `targetType='post', targetId='post-1'`
     * `meta={created: '12351235223'}`
 * `Post` (already exists)
   * `CONTAINS` (relation)
     * `sourceType='post', sourceId='post-1'`
     * `targetType='comment', targetId='comment-1'`
     * `meta={created: '12351235223'}`

# Reads
Reads are multi-layer without path traversals found in a
dedicated graph database (i.e. Neo4J). You identify where to
begin (i.e. Post (post-1)) and first find all relations
for that Post. You then loop through the relations and find
related nodes. Optionally you can go additional layers and find
relations to those nodes.

Although using up more space, the nice part about including the
`sourceType` or `targetType` fields on relations is you can
optionally filter the types of relations in the list you want.

This is designed to give the application max flexibility to do
"anything" in the future, but also with layers it's possible
to plug in another database if different needs arise.

## Example (Post)
 * Layer 1: Get relations where sourceId: post-1
   * `SELECT targetType, targetId, relation, meta FROM relation WHERE sourceId='post-1';`
   * `AUTHORED_BY` (targetId: person-1)
   * `LIKED_BY` (targetId: person-2)
   * `CONTAINS` (targetId: comment-1)
 * Layer 2: Get nodes for relations
   * `SELECT id, label, text, meta FROM node WHERE enabled=true AND id IN ('post-1', 'person-1', 'person-2', 'comment-1');`
   * Post (id: post-1)
   * Person (id: person-1)
   * Person (id: person-2)
   * Comment (id: comment-1)
 * Layer 3: [optional] Get Comment relations
   * `SELECT targetType, targetId, relation, meta FROM relation WHERE sourceId='comment-1';`
   * `AUTHORED_BY` (targetId: person-2)
 * Layer 4: [optional] Get author node
   * `person-2` already retrieved so nothing to do

With the data above, we could assemble a post and all associated
data (likes and comments) with a few queries and no costly JOINs. Depending
on length of the relation lists, fetching associated nodes, etc. may leverage
a cache but this is already super fast without to get started.

### Why not use JOIN from relation to node?
You can easily use a JOIN to fetch relations AND nodes in a single query.
This example ignores that because we may want to fetch from cache which would
be faster than from database, and splitting them out allows this.
