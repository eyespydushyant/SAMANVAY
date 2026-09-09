import React, { useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ScheduledBlock } from '../types';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});


interface Props {
  blocks: ScheduledBlock[];
  onBlockClick: (block: ScheduledBlock) => void;
}

export default function GanttChart({ blocks, onBlockClick }: Props) {
  const events = useMemo(() => {
    return blocks.map(block => ({
      id: block.block_id,
      title: `${block.departments_involved.join('+')} (${block.tasks?.length ?? 0} tasks)`,
      start: new Date(block.start_datetime),
      end: new Date(block.end_datetime),
      resourceId: block.corridor_id,
      blockData: block,
    }));
  }, [blocks]);

  const resources = useMemo(() => {
    const map = new Map();
    blocks.forEach(b => {
      if (!map.has(b.corridor_id)) {
        map.set(b.corridor_id, { id: b.corridor_id, title: b.corridor_name });
      }
    });
    return Array.from(map.values());
  }, [blocks]);

  const eventPropGetter = (event: any) => {
    const depts = event.blockData.departments_involved;
    let bg = '#6366F1'; // default brand
    if (depts.length > 1) bg = '#8B5CF6'; // purple merged
    else if (depts[0] === 'Engineering') bg = '#3B82F6';
    else if (depts[0] === 'S&T') bg = '#F97316';
    else if (depts[0] === 'TRD') bg = '#10B981';

    return {
      style: {
        backgroundColor: bg,
        borderRadius: '4px',
        opacity: 0.9,
        color: '#fff',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="h-[600px] bg-slate-900 border border-slate-800 rounded-lg p-4">
      <Calendar
        localizer={localizer}
        events={events}
        defaultView="day"
        views={['day', 'week', 'agenda']}
        step={30}
        timeslots={2}
        resources={resources}
        resourceIdAccessor="id"
        resourceTitleAccessor="title"
        eventPropGetter={eventPropGetter}
        onSelectEvent={(e: any) => onBlockClick(e.blockData)}
        tooltipAccessor={(e: any) => `${e.blockData.corridor_name}\n${e.title}\n${e.blockData.explanation}`}
      />
    </div>
  );
}
