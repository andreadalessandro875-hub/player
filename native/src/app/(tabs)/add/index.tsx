import { Directory, File, Paths } from 'expo-file-system';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bouncy, Icon } from '../../../components/ui';
import { toast } from '../../../lib/actions';
import { success } from '../../../lib/haptics';
import { AUDIO_EXT, importFile, importInbox, lib, libraryBytes, syncFolder } from '../../../lib/library';
import { colors } from '../../../lib/theme';

type Busy = null | { label: string; done: number; total: number };
const gb = (b: number) => (b > 1e9 ? `${(b / 1e9).toFixed(1).replace('.', ',')} GB` : `${Math.round(b / 1e6)} MB`);

export default function Add() {
  const count = lib.use(s => s.tracks.length);
  const [busy, setBusy] = useState<Busy>(null);
  const [last, setLast] = useState('');

  const finish = (added: number, extra = '') => {
    setBusy(null);
    const msg = added ? (added === 1 ? '1 brano aggiunto' : `${added} brani aggiunti`) : 'Nessun brano nuovo';
    setLast(msg + extra);
    if (added) success();
    toast(msg);
  };

  const pickFiles = async () => {
    const res = await File.pickFileAsync({ multipleFiles: true, mimeTypes: ['audio/*'] }).catch(() => null);
    if (!res || res.canceled) return;
    const files = res.result.filter(f => AUDIO_EXT.test(f.name));
    let added = 0;
    for (let i = 0; i < files.length; i++) {
      setBusy({ label: files[i].name, done: i, total: files.length });
      try { if (await importFile(files[i])) added++; } catch { /* file non importabile */ }
    }
    finish(added);
  };

  const pickFolder = async () => {
    let dir: Directory;
    try { dir = await Directory.pickDirectoryAsync(); } catch { return; }
    setBusy({ label: 'Lettura della cartella…', done: 0, total: 0 });
    try {
      const r = await syncFolder(dir, (done, total, name) => setBusy({ label: name || 'Completamento…', done, total }));
      finish(r.added, r.found ? '' : ' (nessun file nuovo nella cartella)');
    } catch {
      setBusy(null);
      toast('Impossibile leggere la cartella');
    }
  };

  const scanInbox = async () => {
    setBusy({ label: 'Cartella Loop…', done: 0, total: 0 });
    const n = await importInbox((done, total) => setBusy({ label: 'Cartella Loop', done, total }));
    finish(n);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Aggiungi' }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.bg }} contentContainerStyle={s.content}>
        <Option
          icon="folder.badge.plus"
          title="Sincronizza una cartella"
          text="Scegli la cartella “Loop Player” su Google Drive (o iCloud) nell’app File: vengono importati solo i brani nuovi."
          onPress={pickFolder}
          disabled={!!busy}
        />
        <Option
          icon="doc.badge.plus"
          title="Importa file"
          text="Scegli uno o più brani dall’app File."
          onPress={pickFiles}
          disabled={!!busy}
        />
        <Option
          icon="arrow.down.doc"
          title="Controlla la cartella Loop"
          text="I file copiati in “Sul mio iPhone › Loop” (app File) o dal PC entrano nella libreria. Succede anche da solo a ogni apertura."
          onPress={scanInbox}
          disabled={!!busy}
        />

        {busy && (
          <View style={s.progress}>
            <ActivityIndicator color={colors.text} />
            <View style={{ flex: 1 }}>
              <Text style={s.progTitle} numberOfLines={1}>{busy.label}</Text>
              {busy.total > 0 && <Text style={s.progSub}>{busy.done} di {busy.total}</Text>}
            </View>
          </View>
        )}
        {!busy && !!last && <Text style={s.last}>{last}</Text>}

        <View style={s.info}>
          <Row label="Brani nella libreria" value={String(count)} />
          <Row label="Spazio usato" value={gb(libraryBytes())} />
          <Row label="Spazio libero" value={gb(Paths.availableDiskSpace)} />
        </View>

        <Text style={s.help}>
          Dal PC Windows: apri l’app Dispositivi Apple (o iTunes), seleziona l’iPhone, poi File › Loop e trascina lì i brani.
          Alla prossima apertura dell’app compaiono nella libreria.
        </Text>
      </ScrollView>
    </>
  );
}

function Option({ icon, title, text, onPress, disabled }: { icon: any; title: string; text: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Bouncy style={s.card} onPress={onPress} disabled={disabled} label={title}>
      <View style={s.tile}><Icon name={icon} size={24} /></View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={s.cardTitle}>{title}</Text>
        <Text style={s.cardText}>{text}</Text>
      </View>
      <Icon name="chevron.right" size={14} color={colors.muted} />
    </Bouncy>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  content: { padding: 16, paddingBottom: 160, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, backgroundColor: colors.surface },
  tile: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '600' },
  cardText: { color: colors.muted, fontSize: 14, lineHeight: 19 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, backgroundColor: colors.surface },
  progTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  progSub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  last: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  info: { borderRadius: 16, backgroundColor: colors.surface, paddingHorizontal: 16, marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  rowLabel: { color: colors.text, fontSize: 16 },
  rowValue: { color: colors.muted, fontSize: 16 },
  help: { color: colors.muted, fontSize: 13, lineHeight: 19, paddingHorizontal: 4, marginTop: 4 },
});
