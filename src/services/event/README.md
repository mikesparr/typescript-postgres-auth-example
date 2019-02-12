# Event logging and searching
Nearly every application requires providing support at some point
to end users. Many problems can be resolved without engineering
assistance as long as enough information exists to help troubleshoot.

## Model after global standards Activity Streams
 * SEE: [Activity Streams](https://www.w3.org/TR/activitystreams-vocabulary/#activity-types)

## Using EventEmitter
In every Dao class, every method (or helper) must `emit` an event
using the `/src/config/events.ts` file the standard format. By
following this rule, the application centralizes handling of events
either for logging purposes or later adding queues, databases, etc.
The key to make this work is by logging enough data that if some
system subscribed to all the events, it could rebuild the database
state. This technique is known as [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
and decouples the application state from user events.

## Logging in Elasticsearch
To illustrate this technique and the power of the ES architecture, when
deciding to add this functionality we only had to add a single method
`save(data)` to the `event.ts` file and all events were logged in another
database. Of course we added a little error handling, and then API
endpoints to allow searching the data, but no major code rewrites were needed.

## Future expandability
We later decided we wanted a graph model to be able to analyze graph
relations between entities. With a little planning, we can add another
function in the `event.ts` file to `updateGraph(data)` or similar, and
that function could extract what it needs from the events to maintain
the graph database.

 * key concept for success: be consistent
