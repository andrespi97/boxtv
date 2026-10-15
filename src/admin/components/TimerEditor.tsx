import { useState } from 'react';
import type { AdminCommand, TimerConfig, TimerMode, TimerState } from '@/shared/types/signage';
import { formatTime } from '@/shared/timer';
import { Button, Field, Select, TextInput } from './ui';

type TimerEditorProps = {
  timer: TimerState | null;
  onCommand: (command: AdminCommand) => void;
  pending: boolean;
};

const MODE_LABELS: { value: TimerMode; label: string }[] = [
  { value: 'countdown', label: 'Cuenta atrás' },
  { value: 'amrap', label: 'AMRAP' },
  { value: 'intervals', label: 'Intervalos (trabajo/descanso)' },
];

export function TimerEditor({ timer, onCommand, pending }: TimerEditorProps) {
  const [mode, setMode] = useState<TimerMode>(timer?.mode ?? 'countdown');
  const [workMinutes, setWorkMinutes] = useState(() =>
    timer ? Math.floor(timer.workSeconds / 60) : 10,
  );
  const [workSecondsPart, setWorkSecondsPart] = useState(() => (timer ? timer.workSeconds % 60 : 0));
  const [restSeconds, setRestSeconds] = useState(timer?.restSeconds ?? 30);
  const [rounds, setRounds] = useState(timer?.rounds ?? 5);

  const config: TimerConfig = {
    mode,
    workSeconds: Math.max(0, workMinutes) * 60 + Math.max(0, Math.min(59, workSecondsPart)),
    restSeconds: Math.max(0, restSeconds),
    rounds: Math.max(1, rounds),
  };

  const status = timer?.status ?? 'idle';

  return (
    <div className="space-y-4">
      <Field label="Modo">
        <Select value={mode} onChange={(e) => setMode(e.target.value as TimerMode)}>
          {MODE_LABELS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      {mode === 'intervals' ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Trabajo (min)">
            <TextInput
              type="number"
              min={0}
              value={workMinutes}
              onChange={(e) => setWorkMinutes(Number(e.target.value))}
            />
          </Field>
          <Field label="Trabajo (seg)">
            <TextInput
              type="number"
              min={0}
              max={59}
              value={workSecondsPart}
              onChange={(e) => setWorkSecondsPart(Number(e.target.value))}
            />
          </Field>
          <Field label="Descanso (seg)">
            <TextInput
              type="number"
              min={0}
              value={restSeconds}
              onChange={(e) => setRestSeconds(Number(e.target.value))}
            />
          </Field>
          <Field label="Rondas">
            <TextInput
              type="number"
              min={1}
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
            />
          </Field>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label={mode === 'amrap' ? 'Duración (min)' : 'Tiempo (min)'}>
            <TextInput
              type="number"
              min={0}
              value={workMinutes}
              onChange={(e) => setWorkMinutes(Number(e.target.value))}
            />
          </Field>
          <Field label="Segundos">
            <TextInput
              type="number"
              min={0}
              max={59}
              value={workSecondsPart}
              onChange={(e) => setWorkSecondsPart(Number(e.target.value))}
            />
          </Field>
          {mode === 'amrap' && (
            <Field label="Rondas objetivo">
              <TextInput
                type="number"
                min={1}
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
              />
            </Field>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-slate-800/50 p-3">
        <span className="mr-auto text-sm text-slate-300">
          Estado:{' '}
          <strong className="text-white">
            {status === 'running'
              ? 'En marcha'
              : status === 'paused'
                ? 'En pausa'
                : status === 'finished'
                  ? 'Finalizado'
                  : 'Listo'}
          </strong>
          {timer && status !== 'idle' && (
            <span className="ml-2 text-slate-400">({formatTime(timer.workSeconds)})</span>
          )}
        </span>

        {status === 'running' ? (
          <Button variant="secondary" disabled={pending} onClick={() => onCommand({ type: 'PAUSE_TIMER' })}>
            Pausar
          </Button>
        ) : status === 'paused' ? (
          <Button variant="primary" disabled={pending} onClick={() => onCommand({ type: 'RESUME_TIMER' })}>
            Reanudar
          </Button>
        ) : (
          <Button
            variant="primary"
            disabled={pending}
            onClick={() => onCommand({ type: 'START_TIMER', config })}
          >
            Iniciar
          </Button>
        )}

        <Button variant="ghost" disabled={pending} onClick={() => onCommand({ type: 'STOP_TIMER' })}>
          Detener
        </Button>
        <Button variant="ghost" disabled={pending} onClick={() => onCommand({ type: 'RESET_TIMER' })}>
          Reiniciar
        </Button>
      </div>

      <p className="text-xs text-slate-500">
        Todas las teles calculan el tiempo localmente a partir de la hora de inicio, por lo que se
        mantienen sincronizadas sin enviar un mensaje cada segundo.
      </p>
    </div>
  );
}
