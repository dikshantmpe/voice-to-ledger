'use client';
import { useApp } from '@/context/AppContext';
import { dateLabel, fmt } from '@/lib/format';
import { speak, describeEntry } from '@/lib/speech';
import { lowFields, LOW_CONF } from './lowFields';

export const narration = (e) => e.nature + (e.party ? (e.dir === 'in' ? ' from ' : ' to ') + e.party : '');

function Field({ label, value, hl }) {
  return (
    <div className={'rf' + (hl ? ' hl' : '')}>
      <span className="rf-l">{label}</span>
      <b className="rf-v">{value}</b>
    </div>
  );
}

export default function ReviewCard({ e, tab, onEdit }) {
  const { t, lang, speechLang, approve, reject, restore } = useApp();
  const lf = lowFields(e);
  const low = e.conf < LOW_CONF;
  const pend = tab === 'pending';
  const debit = e.lines[0];
  const credit = e.lines[1];

  const cls = 'entry' + (pend ? (e.flags.length ? ' warn' : '') + (low ? ' lowconf' : '') : tab === 'approved' ? ' done' : ' rej');

  return (
    <div className={cls}>
      <div className="entryhead">
        <span className={'tag ' + (e.dir === 'in' ? 'in' : e.dir === 'out' ? 'out' : 'flag')}>
          {e.dir === 'in' ? t('in') : e.dir === 'out' ? t('out') : t('unknown_dir')}
        </span>
        {pend && e.flags.map((f) => <span key={f} className="tag flag">⚑ {f}</span>)}
        {pend && low && <span className="tag low">low confidence {Math.round(e.conf * 100)}%</span>}
      </div>

      <div className="phrase">“{e.phrase}”</div>

      {/* the 7 fields required on the review card */}
      <div className="rgrid">
        <Field label={t('rev_date')} value={dateLabel(e.date)} />
        <Field label={t('rev_party')} value={e.party || t('rev_noparty')} hl={pend && lf.party} />
        <Field label={t('rev_debit')} value={debit ? `${debit.a} · ${fmt(debit.d)}` : '—'} hl={pend && lf.debit} />
        <Field label={t('rev_credit')} value={credit ? `${credit.a} · ${fmt(credit.c)}` : '—'} hl={pend && lf.credit} />
        <Field label={t('rev_amount')} value={e.amount ? fmt(e.amount) : '—'} hl={pend && lf.amount} />
        <Field label={t('rev_narr')} value={narration(e)} hl={pend && lf.narration} />
        <Field label={t('rev_conf')} value={Math.round(e.conf * 100) + '%'} hl={pend && low} />
      </div>
      {!e.lines.length && <div className="debit-credit">{t('rev_invalid')}</div>}

      <div className="entryacts">
        {pend && (
          <>
            <button className="btn sm" onClick={() => approve(e.id)}>{t('approve')}</button>
            <button className="btn sm soft" onClick={() => onEdit(e)}>{t('edit')}</button>
            <button className="btn sm red" onClick={() => reject(e.id)}>{t('reject')}</button>
          </>
        )}
        {!pend && tab === 'rejected' && <button className="btn sm" onClick={() => restore(e.id)}>{t('restore')}</button>}
        <button className="btn sm soft" style={{ marginLeft: 'auto' }}
          onClick={() => speak(describeEntry(e, lang), speechLang)}>{t('listen')}</button>
      </div>
    </div>
  );
}
