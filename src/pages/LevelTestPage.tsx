import LevelTest from '../components/LevelTest';
import SubPageLayout from '../components/SubPageLayout';

// /level-test: the placement test for parents.
export default function LevelTestPage() {
  return (
    <SubPageLayout page="/level-test">
      <LevelTest />
    </SubPageLayout>
  );
}
