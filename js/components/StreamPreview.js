/**
 * StreamPreview Component
 * Handles HLS video preview for channels
 */

import api from '../api.js';
import { escapeHtml } from '../utils.js';

// HLS Configuration Constants
const HLS_CONFIG = {
    enableWorker: true,
    lowLatencyMode: true,
    backBufferLength: 90,
    maxBufferLength: 10,
    maxMaxBufferLength: 20,
    manifestLoadingMaxRetry: 3,
    levelLoadingMaxRetry: 3,
    fragLoadingMaxRetry: 3,
};

// Default HLS port - can be overridden via server configuration
const DEFAULT_HLS_PORT = 8888;

class StreamPreview {
    constructor(channelName, containerId, visible = true) {
        this.channelName = channelName;
        this.containerId = containerId;
        this.visible = visible;
        this.hls = null;
        this.videoElement = null;
        this.isPlaying = false;
    }

    /**
     * Render the preview component
     */
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        if (!this.visible) {
            container.innerHTML = `
                <div class="stream-preview-placeholder">
                    <div class="preview-icon">👁️‍🗨️</div>
                    <div class="preview-text">Preview hidden</div>
                </div>
            `;
            return;
        }

        // Get server URL from API config
        const config = api.getConfig();
        if (!config.baseUrl) {
            container.innerHTML = `
                <div class="stream-preview-placeholder">
                    <div class="preview-icon">⚠️</div>
                    <div class="preview-text">Server not configured</div>
                </div>
            `;
            return;
        }

        // Build HLS URL
        // MediaMTX serves HLS at: http://server:port/channelName/index.m3u8
        // Extract the base URL and construct the HLS endpoint
        // TODO: Make HLS port configurable per server
        const serverUrl = config.baseUrl.replace(/:\d+$/, ''); // Remove API port
        const hlsUrl = `${serverUrl}:${DEFAULT_HLS_PORT}/${this.channelName}/index.m3u8`;

        container.innerHTML = `
            <div class="stream-preview-container">
                <video 
                    id="video-${escapeHtml(this.channelName)}" 
                    class="stream-preview-video"
                    controls
                    muted
                    playsinline
                ></video>
                <div class="stream-preview-overlay hidden" id="overlay-${escapeHtml(this.channelName)}">
                    <div class="preview-icon">📡</div>
                    <div class="preview-text">No signal</div>
                </div>
            </div>
        `;

        // Initialize HLS player
        this.initializePlayer(hlsUrl);
    }

    /**
     * Initialize HLS player
     */
    initializePlayer(hlsUrl) {
        const videoId = `video-${this.channelName}`;
        this.videoElement = document.getElementById(videoId);
        
        if (!this.videoElement) return;

        // Check if HLS.js is supported
        if (typeof Hls !== 'undefined' && Hls.isSupported()) {
            this.hls = new Hls(HLS_CONFIG);

            this.hls.loadSource(hlsUrl);
            this.hls.attachMedia(this.videoElement);

            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                this.hideOverlay();
                // Auto-play muted
                this.videoElement.play().catch(e => {
                    console.log('Auto-play failed:', e.message);
                });
                this.isPlaying = true;
            });

            this.hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    this.showOverlay();
                    this.isPlaying = false;
                    
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            // Try to recover from network error
                            setTimeout(() => {
                                if (this.hls) {
                                    this.hls.startLoad();
                                }
                            }, 3000);
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            if (this.hls) {
                                this.hls.recoverMediaError();
                            }
                            break;
                        default:
                            // Cannot recover
                            break;
                    }
                }
            });
        } else if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            this.videoElement.src = hlsUrl;
            this.videoElement.addEventListener('loadedmetadata', () => {
                this.hideOverlay();
                this.videoElement.play().catch(e => {
                    console.log('Auto-play failed:', e.message);
                });
                this.isPlaying = true;
            });
            this.videoElement.addEventListener('error', () => {
                this.showOverlay();
                this.isPlaying = false;
            });
        } else {
            // HLS not supported
            this.showOverlay();
            const overlay = document.getElementById(`overlay-${this.channelName}`);
            if (overlay) {
                overlay.innerHTML = `
                    <div class="preview-icon">⚠️</div>
                    <div class="preview-text">HLS not supported in this browser</div>
                `;
            }
        }
    }

    /**
     * Show no signal overlay
     */
    showOverlay() {
        const overlay = document.getElementById(`overlay-${this.channelName}`);
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }

    /**
     * Hide no signal overlay
     */
    hideOverlay() {
        const overlay = document.getElementById(`overlay-${this.channelName}`);
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    /**
     * Update visibility
     */
    setVisible(visible) {
        this.visible = visible;
        if (visible) {
            this.render();
        } else {
            this.destroy();
            this.render();
        }
    }

    /**
     * Destroy player and clean up resources
     */
    destroy() {
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.src = '';
            this.videoElement = null;
        }
        this.isPlaying = false;
    }
}

export default StreamPreview;
