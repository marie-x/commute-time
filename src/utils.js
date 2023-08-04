// Copyright 2023 max
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function pad0(n) {
    return new String(n).padStart(2, '0')
}

function toDuration(ms) {
    const secs = Math.floor(ms / 1000) // in case of float
    // log('toDuration', secs)
    const h = Math.floor(secs / (60 * 60))
    const m = Math.floor(secs / 60) % 60
    const s = secs % 60
    const ss = pad0(s)
    // TODO make nicer
    if (h) {
        const mm = pad0(m)
        if (!m && !s) {
            return h + 'h'
        }
        return h + 'h' + mm + 'm' + ss
    }
    if (m) {
        if (!s) {
            return m + 'm'
        }
        return m + 'm' + ss
    }
    return s + 's'
}

module.exports = { pad0, toDuration }