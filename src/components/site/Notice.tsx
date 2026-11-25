// The popup: a white card with the ink outline and offset shadow, top center.
// A picture from the editor if there is one, else the fireworks drawing for celebrations.
import { NoticeCore, type Notice } from '../shared/NoticeCore';
import { Scene } from '../shared/Scene';
import { Icon } from '../shared/icons/Icon';
import { ui } from '../../content/deck';
import { href } from '../../lib/href';

export default function Notice({ notice, page = 'home' }: { notice: Notice; page?: 'home' | 'other' }) {
  return (
    <NoticeCore notice={notice} page={page} className="d1-notice" backdropClassName="d1-notice-backdrop">
      {({ titleId, close }) => (
        <>
          {notice.image ? (
            <img className="d1-notice__img" src={notice.image.startsWith('http') ? notice.image : href(notice.image)} alt={notice.image_alt ?? ''} />
          ) : notice.style === 'celebration' && <Scene slot="fireworks" className="d1-notice__art" />}
          <div className="d1-notice__body">
            <p className="d1-notice__kicker">{ui.notice}</p>
            <h2 id={titleId} className="d1-display d1-notice__title">{notice.title}</h2>
            <p className="d1-notice__text">{notice.body}</p>
            {notice.button_url && notice.button_label && (
              <a className="d1-btn" href={notice.button_url} target="_blank" rel="noopener noreferrer">{notice.button_label}<Icon name="arrow" /></a>
            )}
          </div>
          <button type="button" className="d1-notice__close" onClick={close}><Icon name="close" /><span>{ui.close}</span></button>
        </>
      )}
    </NoticeCore>
  );
}
