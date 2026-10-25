import { View } from 'react-native';
import { Card, Label, Row } from '../../components/UI';
import { IconTile } from '../../components/AcademySignature';
import { useSchool } from '../../store/School';
import type { LifeState } from './life-model';
export function LifeOverview({ life, date }: { life: LifeState; date: string }) {
  const { colors } = useSchool();
  const done = Object.values(life.routineChecks[date] || {}).filter((v) => v === 'done').length;
  const rest = Object.values(life.checks[date] || {}).filter((v) => v.status !== 'active').length;
  return (
    <Card style={{ backgroundColor: colors.soft }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1, minWidth: 180, gap: 8 }}>
          <Label bold size={28}>
            Room to grow.
          </Label>
          <Label>Your day can hold learning, movement and a little breathing space.</Label>
        </View>
        <View
          accessible
          accessibilityLabel="Learning, nature and rest"
          style={{ gap: 8, alignItems: 'center', padding: 12 }}
        >
          <IconTile icon="sunny-outline" large />
          <Row>
            <IconTile icon="leaf-outline" />
            <IconTile icon="book-outline" />
            <IconTile icon="moon-outline" />
          </Row>
        </View>
      </Row>
      <Row>
        <Label bold>{done} activities recorded done</Label>
        <Label>{rest} habit rest/skip choices</Label>
      </Row>
      {life.planner.wake && life.planner.sleep ? (
        <Label>
          My chosen rhythm: wake {life.planner.wake} · sleep {life.planner.sleep}. Preferences, not
          measured sleep.
        </Label>
      ) : (
        <Label muted>Start with your own waking and sleep preferences in Planner.</Label>
      )}
    </Card>
  );
}
