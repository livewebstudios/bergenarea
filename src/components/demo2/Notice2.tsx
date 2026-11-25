// Demo 2 notice skin: an outlined tile at the bottom edge. A bottom sheet on mobile.
import { NoticeCore, type Notice } from '../shared/NoticeCore';
import { Scene } from '../shared/Scene';
import { Icon } from '../shared/icons/Icon';
import { ui } from '../../content/deck';

export default function Notice2({ notice }: { notice: Notice }) {
  return (
    <NoticeCore notice={notice} className="d2-notice d2-tile" backdropClassName="d2-notice-backdrop">
      {({ titleId, close }) => (
        <>
          {notice.style === 'celebration' && <div className="d2-notice__art"><Scene slot="fireworks" /></div>}
          <div className="d2-notice__body">
            <p className="d2-kicker">{ui.notice}</p>
            <h2 id={titleId} className="d2-display d2-notice__title">{notice.title}</h2>
            <p className="d2-mono d2-notice__text">{notice.body}</p>
            <div className="d2-notice__actions">
              {notice.button_url && notice.button_label && (
                <a className="d2-btn" href={notice.button_url} target="_blank" rel="noopener noreferrer">{notice.button_label}<Icon name="arrow" /></a>
              )}
              <button type="button" className="d2-btn d2-btn--alt" onClick={close}><Icon name="close" />{ui.close}</button>
            </div>
          </div>
        </>
      )}
    </NoticeCore>
  );
}
