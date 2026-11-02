import { lazy, Suspense } from 'react';
import WordPlay from '../components/WordPlay';
import ProfileBar from '../components/ProfileBar';
import PlayNav from '../components/PlayNav';
import SubPageLayout from '../components/SubPageLayout';
import { activities } from '../components/activities/registry';
import { features } from '../features';

// /play: the play menu, who's playing, word cards and quiz, then the learning playground (activities, word of the
// day, sticker book).
const Playground = lazy(() => import('../components/Playground'));

const playgroundOn = activities.length > 0 || features.wordOfTheDay;

export default function PlayPage() {
  return (
    <SubPageLayout page="/play">
      <PlayNav />
      {features.profiles && <ProfileBar />}
      <WordPlay />
      {playgroundOn && (
        <Suspense>
          <Playground />
        </Suspense>
      )}
    </SubPageLayout>
  );
}
