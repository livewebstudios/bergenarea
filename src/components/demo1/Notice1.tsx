// Demo 1 notice skin: a white card with the ink outline and offset shadow, top center, header scene on top.
import { NoticeCore, type Notice } from '../shared/NoticeCore';
import { Scene } from '../shared/Scene';
import { Icon } from '../shared/icons/Icon';
import { ui } from '../../content/deck';

export default function Notice1({ notice }: { notice: Notice }) {
  return (
    <NoticeCore notice={notice} className="d1-notice" backdropClassName="d1-notice-backdrop">
      {({ titleId, close }) => (
        <>
          {notice.style === 'celebration' && <Scene slot="fireworks" className="d1-notice__art" />}
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
