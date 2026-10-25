import React, { useState } from 'react';
import { Button, Card, Label, Row } from './UI';
import { useSchool } from '../store/School';
import { auth, API } from '../services/auth';
import { readProgress, type Progress } from '../utils/progress';

export function CloudProgress() {
  const { state, update, t } = useSchool();
  const [remote, setRemote] = useState<{
    revision: number;
    snapshot: Progress | null;
    updated_at: string | null;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState<'restore' | 'delete' | null>(null);
  const request = async (method: string, body?: unknown) => {
    const token = await auth.token();
    if (!token) throw new Error('OWNER_LOGIN_REQUIRED');
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 20000);
    try {
      const response = await fetch(API + '/api/learning-mobile/progress', {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: abort.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'PROGRESS_STORAGE_UNAVAILABLE');
      return data;
    } finally {
      clearTimeout(timer);
    }
  };
  const run = async (action: 'check' | 'save' | 'delete') => {
    setBusy(true);
    setMessage('');
    try {
      if (action === 'check') {
        const data = await request('GET');
        setRemote({
          ...data,
          snapshot: data.snapshot ? readProgress(JSON.stringify(data.snapshot)) : null,
        });
      } else if (action === 'save' && remote) {
        const saved = await request('PUT', { revision: remote.revision, snapshot: state });
        setRemote({ ...saved, snapshot: state });
        setMessage(t('Sauvegarde enregistrée.', 'Cloud backup saved.', 'حُفظت النسخة السحابية.'));
      } else if (action === 'delete' && remote) {
        await request('DELETE', { revision: remote.revision });
        setRemote({ revision: 0, snapshot: null, updated_at: null });
        setConfirm(null);
        setMessage(
          t('Sauvegarde cloud supprimée.', 'Cloud backup deleted.', 'حُذفت النسخة السحابية.'),
        );
      }
    } catch (e) {
      const conflict = e instanceof Error && e.message === 'BACKUP_CONFLICT';
      setRemote(null);
      setConfirm(null);
      setMessage(
        conflict
          ? t(
              'Un autre appareil a modifié la sauvegarde. Vérifiez à nouveau avant de continuer.',
              'Another device changed the backup. Check again before continuing.',
              'غيّر جهاز آخر النسخة الاحتياطية. تحقّق منها مجددًا قبل المتابعة.',
            )
          : t(
              'Sauvegarde indisponible. Vérifiez la connexion et la configuration de la base Academy côté serveur.',
              'Cloud storage is unavailable. Check your connection and the server’s Academy database setup.',
              'التخزين السحابي غير متاح. تحقّق من الاتصال وتهيئة قاعدة بيانات الأكاديمية في الخادم.',
            ),
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <Label bold>
        {t('Sauvegarde entre appareils', 'Backup across devices', 'نسخة احتياطية بين الأجهزة')}
      </Label>
      <Label muted>
        {t(
          'Manuelle et liée au compte connecté. Inclut notes et conversations. Vérifiez la sauvegarde avant de la remplacer.',
          'Manual backup for the signed-in account. Includes notes and conversations. Check the backup before replacing it.',
          'نسخة يدوية للحساب المسجّل تشمل الملاحظات والمحادثات. تحقّق من النسخة قبل استبدالها.',
        )}
      </Label>
      <Button
        quiet
        loading={busy}
        title={t('Vérifier la sauvegarde cloud', 'Check cloud backup', 'تحقّق من النسخة السحابية')}
        onPress={() => run('check')}
      />
      {remote && (
        <>
          <Label>
            {remote.snapshot
              ? `${remote.updated_at} · ${remote.snapshot.completed.length} ${t('leçons', 'lessons', 'دروس')}`
              : t('Aucune sauvegarde cloud.', 'No cloud backup yet.', 'لا توجد نسخة سحابية بعد.')}
          </Label>
          <Row>
            <Button
              disabled={busy}
              title={t(
                'Enregistrer cet appareil dans le cloud',
                'Save this device to cloud',
                'احفظ هذا الجهاز في السحابة',
              )}
              onPress={() => run('save')}
            />
            {remote.snapshot && (
              <>
                <Button
                  quiet
                  disabled={busy}
                  title={t(
                    'Restaurer sur cet appareil',
                    'Restore to this device',
                    'استعد على هذا الجهاز',
                  )}
                  onPress={() => setConfirm('restore')}
                />
                <Button
                  quiet
                  disabled={busy}
                  title={t('Supprimer la copie cloud', 'Delete cloud copy', 'احذف النسخة السحابية')}
                  onPress={() => setConfirm('delete')}
                />
              </>
            )}
          </Row>
        </>
      )}
      {confirm && (
        <>
          <Label>
            {confirm === 'restore'
              ? t(
                  'Remplacer les données locales par cette sauvegarde ? Exportez d’abord les données locales à conserver.',
                  'Replace local learning data with this backup? Export local data you want to keep first.',
                  'استبدال بيانات التعلّم المحلية بهذه النسخة؟ صدّر أولًا البيانات التي تريد الاحتفاظ بها.',
                )
              : t(
                  'Supprimer définitivement la sauvegarde cloud ?',
                  'Permanently delete the cloud backup?',
                  'هل تريد حذف النسخة السحابية نهائيًا؟',
                )}
          </Label>
          <Row>
            <Button
              disabled={busy}
              title={t('Confirmer', 'Confirm', 'تأكيد')}
              onPress={() => {
                if (confirm === 'delete') {
                  void run('delete');
                } else if (remote?.snapshot) {
                  const snapshot = remote.snapshot;
                  update(() => ({ ...snapshot, reminder: state.reminder }));
                  setConfirm(null);
                  setMessage(t('Sauvegarde restaurée.', 'Backup restored.', 'استُعيدت النسخة.'));
                }
              }}
            />
            <Button
              quiet
              title={t('Annuler', 'Cancel', 'إلغاء')}
              onPress={() => setConfirm(null)}
            />
          </Row>
        </>
      )}
      {!!message && <Label accessibilityLiveRegion="polite">{message}</Label>}
    </Card>
  );
}
