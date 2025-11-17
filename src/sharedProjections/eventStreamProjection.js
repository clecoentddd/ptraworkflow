// Projection: returns filtered event stream
export default function eventStreamProjection(events, filterFn) {
  return filterFn ? events.filter(filterFn) : events;
}
