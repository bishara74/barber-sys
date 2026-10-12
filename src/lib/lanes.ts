type Timed = { start: number; end: number };

export type Placed<T> = T & { lane: number; lanes: number };

/**
 * Places overlapping events side by side, like a calendar app: each event gets a lane,
 * and every event in a group of overlapping events shares that group's lane count.
 */
export function layoutLanes<T extends Timed>(items: T[]): Placed<T>[] {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  const placed: Placed<T>[] = [];
  let cluster: Placed<T>[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -Infinity;

  const closeCluster = () => {
    for (const item of cluster) item.lanes = laneEnds.length;
    placed.push(...cluster);
    cluster = [];
    laneEnds = [];
    clusterEnd = -Infinity;
  };

  for (const item of sorted) {
    if (item.start >= clusterEnd) closeCluster();
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = item.end;
    cluster.push({ ...item, lane, lanes: 0 });
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  closeCluster();
  return placed;
}
