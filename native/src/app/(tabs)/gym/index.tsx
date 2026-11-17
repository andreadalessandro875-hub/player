import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Bouncy, Icon } from '../../../components/ui';
import { actionSheet, toast } from '../../../lib/actions';
import { gym, GYM_PLAN, doneFor, resetDay, setKg, startRest, stopRest, suggestedDay, toggleSet } from '../../../lib/gym';
import { impact, success, tap } from '../../../lib/haptics';
import { colors, fmtTime } from '../../../lib/theme';

export default function Gym() {
  const data = gym.use(s => s.data);
  const [sel, setSel] = useState(() => suggestedDay(gym.get().data));
  const day = GYM_PLAN.find(p => p.key === sel) ?? GYM_PLAN[0];
  const done = doneFor(data, day.key);
  const next = suggestedDay(data);

  const total = useMemo(() => day.ex.reduce((s, e) => s + e.s, 0), [day]);
  const count = Object.keys(done).filter(k => +k.split('-')[0] < day.ex.length).length;

  const onSet = (i: number, j: number) => {
    const on = toggleSet(day.key, `${i}-${j}`);
    impact(on);
    if (!on) return;
    if (count + 1 >= total) { stopRest(); success(); toast('Allenamento completato'); return; }
    const ex = day.ex[i];
    startRest(ex.rest, ex.n, () => { success(); toast('Recupero finito: prossima serie'); });
  };
  const reset = async () => {
    tap();
    const i = await actionSheet({ title: `Azzerare le serie di ${day.day}?`, message: 'I pesi restano salvati.', options: ['Azzera serie'], destructive: 0 });
    if (i === 0) { resetDay(day.key); stopRest(); }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Palestra',
          headerRight: () => (
            <Pressable onPress={reset} hitSlop={10} accessibilityLabel="Azzera le serie di oggi">
              <Icon name="arrow.counterclockwise" size={20} />
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.bg }} contentContainerStyle={s.content} keyboardDismissMode="interactive">
          <View style={s.seg}>
            {GYM_PLAN.map(p => {
              const on = p.key === day.key;
              return (
                <Bouncy key={p.key} style={[s.segBtn, on && s.segOn]} onPress={() => setSel(p.key)} label={`${p.day}, ${p.tag}`}>
                  <Text style={[s.segDay, on && s.segDayOn]}>{p.day}</Text>
                  <Text style={[s.segTag, on && s.segTagOn]} numberOfLines={1}>{p.tag}</Text>
                  {p.key === next && <View style={[s.dot, on && s.dotOn]} accessibilityLabel="giorno proposto" />}
                </Bouncy>
              );
            })}
          </View>

          <Text style={s.title}>{day.day} · {day.title}</Text>
          <Text style={s.desc}>{day.desc}</Text>
          <View style={s.progRow}>
            <Text style={s.progText}>{count} di {total} serie</Text>
            <Text style={s.progPct}>{Math.round((count / total) * 100)}%</Text>
          </View>
          <View style={s.bar}><View style={[s.barFill, { width: `${(count / total) * 100}%` }]} /></View>

          {day.ex.map((e, i) => {
            const complete = Array.from({ length: e.s }, (_, j) => done[`${i}-${j}`]).every(Boolean);
            return (
              <Animated.View key={`${day.key}-${i}`} entering={FadeInDown.delay(i * 40).springify().damping(18)} style={[s.card, complete && s.cardDone]}>
                <View style={s.cardHead}>
                  <View style={s.num}><Text style={s.numText}>{i + 1}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.exName}>{e.n}</Text>
                    <Text style={s.exMeta}>{e.s} × {e.r} · recupero {fmtTime(e.rest)}</Text>
                  </View>
                  {complete && <View style={s.okBadge}><Icon name="checkmark" size={14} color={colors.onAccent} weight="bold" /></View>}
                </View>
                <View style={s.setsRow}>
                  <View style={s.sets}>
                    {Array.from({ length: e.s }, (_, j) => {
                      const on = !!done[`${i}-${j}`];
                      return (
                        <Bouncy key={j} haptic={false} style={[s.set, on && s.setOn]} onPress={() => onSet(i, j)} label={`Serie ${j + 1} di ${e.s}${on ? ', fatta' : ''}`}>
                          <Text style={[s.setText, on && s.setTextOn]}>{j + 1}</Text>
                        </Bouncy>
                      );
                    })}
                  </View>
                  <View style={s.kg}>
                    <TextInput
                      style={s.kgInput}
                      value={data.kg[e.n] ?? ''}
                      onChangeText={v => setKg(e.n, v.replace(/[^\d.,]/g, '').slice(0, 6))}
                      placeholder="—"
                      placeholderTextColor={colors.muted}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                      selectTextOnFocus
                      accessibilityLabel={`Peso per ${e.n}`}
                    />
                    <Text style={s.kgUnit}>kg</Text>
                  </View>
                </View>
                <Text style={s.note}>{e.note}</Text>
              </Animated.View>
            );
          })}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 160 },
  seg: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 18 },
  segBtn: { flex: 1, height: 58, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 2 },
  segOn: { backgroundColor: colors.accent },
  segDay: { color: colors.text, fontSize: 15, fontWeight: '700' },
  segDayOn: { color: colors.onAccent },
  segTag: { color: colors.muted, fontSize: 11, fontWeight: '600', paddingHorizontal: 4 },
  segTagOn: { color: 'rgba(0,0,0,0.6)' },
  dot: { position: 'absolute', top: 7, right: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  dotOn: { backgroundColor: colors.onAccent },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  desc: { color: colors.muted, fontSize: 15, lineHeight: 21, marginTop: 6, marginBottom: 14 },
  progRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  progPct: { color: colors.muted, fontSize: 14 },
  bar: { height: 5, borderRadius: 3, backgroundColor: colors.line, overflow: 'hidden', marginBottom: 16 },
  barFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, gap: 12, marginBottom: 12 },
  cardDone: { opacity: 0.5 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  num: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  numText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  exName: { color: colors.text, fontSize: 17, fontWeight: '600', lineHeight: 22 },
  exMeta: { color: colors.muted, fontSize: 14, marginTop: 2, fontVariant: ['tabular-nums'] },
  okBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  setsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1 },
  set: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.28)', alignItems: 'center', justifyContent: 'center' },
  setOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  setText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  setTextOn: { color: colors.onAccent },
  kg: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 42, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(118,118,128,0.2)' },
  kgInput: { width: 52, color: colors.text, fontSize: 17, fontWeight: '600', textAlign: 'right', fontVariant: ['tabular-nums'] },
  kgUnit: { color: colors.muted, fontSize: 14 },
  note: { color: colors.muted, fontSize: 14, lineHeight: 19 },
});
