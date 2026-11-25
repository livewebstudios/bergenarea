// Demo 3 notice skin: a white card with a lake header band, centered.
import { NoticeCore, type Notice } from '../shared/NoticeCore';
import { Scene } from '../shared/Scene';
import { Icon } from '../shared/icons/Icon';
import { ui } from '../../content/deck';

export default function Notice3({ notice }: { notice: Notice }) {
  return (
    <NoticeCore notice={notice} className="d3-notice" backdropClassName="d3-notice-backdrop">
      {({ titleId, close }) => (
        <>
          <div className="d3-notice__band">
            <p className="d3-notice__kicker">{ui.notice}</p>
            <button type="button" className="d3-notice__close" onClick={close}><Icon name="close" /><span>{ui.close}</span></button>
          </div>
          {notice.style === 'celebration' && <Scene slot="fireworks" className="d3-notice__art" />}
          <div className="d3-notice__body">
            <h2 id={titleId} className="d3-display d3-notice__title">{notice.title}</h2>
            <p className="d3-notice__text">{notice.body}</p>
            {notice.button_url && notice.button_label && (
              <a className="d3-btn" href={notice.button_url} target="_blank" rel="noopener noreferrer">{notice.button_label}<Icon name="arrow" /></a>
            )}
          </div>
        </>
      )}
    </NoticeCore>
  );
}
