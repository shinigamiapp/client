<script setup lang="ts">
import { useNow } from '@vueuse/core';
import initReadMore from '@corgras/readmore-js';
import type { WalineComment, WalineCommentStatus } from '@waline/api';
import type { ComputedRef } from 'vue';
import { computed, inject, onMounted, ref } from 'vue';

import CommentBox from './CommentBox.vue';
import {
  DeleteIcon,
  EditIcon,
  LikeIcon,
  ChevronDownIcon,
	ChevronUpIcon,
  ReplyIcon,
  VerifiedIcon,
	StickyIcon
} from './Icons.js';
import { useLikeStorage, useUserInfo } from '../composables/index.js';
import type { WalineConfig } from '../utils/index.js';
import { getTimeAgo, isLinkHttp } from '../utils/index.js';

const props = withDefaults(
  defineProps<{
    comment: WalineComment;
    edit?: WalineComment | null;
    rootId: string;
    reply?: WalineComment | null;
  }>(),
  {
    edit: null,
    reply: null,
  },
);

const emit = defineEmits<{
  (event: 'log'): void;
  (event: 'submit', comment: WalineComment): void;
  (event: 'delete', comment: WalineComment): void;
  (event: 'edit', comment: WalineComment | null): void;
  (event: 'like', comment: WalineComment): void;
  (
    event: 'status',
    statusInfo: { status: WalineCommentStatus; comment: WalineComment },
  ): void;
  (event: 'sticky', comment: WalineComment): void;
  (event: 'reply', comment: WalineComment | null): void;
	(event: 'banned', comment: WalineComment): void;
}>();

const commentStatus: WalineCommentStatus[] = ['approved', 'waiting', 'spam'];

const config = inject<ComputedRef<WalineConfig>>('config')!;
const likes = useLikeStorage();
const now = useNow();
const userInfo = useUserInfo();

const locale = computed(() => config.value.locale);

const link = computed(() => {
  const { link } = props.comment;

  return link ? (isLinkHttp(link) ? link : `https://${link}`) : '';
});

const like = computed(() => likes.value.includes(props.comment.objectId));

const time = computed(() =>
  getTimeAgo(new Date(props.comment.time), now.value, locale.value),
);

const isAdmin = computed(() => userInfo.value.type === 'administrator');

const isOwner = computed(
  () =>
    props.comment.user_id && userInfo.value.objectId === props.comment.user_id,
);

const isReplyingCurrent = computed(
  () => props.comment.objectId === props.reply?.objectId,
);

const isEditingCurrent = computed(
  () => props.comment.objectId === props.edit?.objectId,
);

const showReplies = ref<boolean>(false);
function init() {
	initReadMore('.wl-readmore', { 
		collapsedHeight: 200,
		speed: 300,
		moreLink: '<span>Read More</span>',
		lessLink: '',
		afterToggle: (button: any, _element: any, isExpanded: boolean) => {
			if(isExpanded) {
				button.style.display = 'none';
			}
		}
	});
}

function onSubmit(comment: WalineComment) {
	emit('submit', comment);
	init();
}

function onEdit(comment: WalineComment) {
	emit('edit', comment);
	init();
}

function onReply(comment: WalineComment) {
	emit('reply', isReplyingCurrent.value ? null : comment)
	showReplies.value = true;
}

onMounted(() => {
	
	init();
})
</script>

<template>
  <div
    :id="comment.objectId"
    :class="['wl-card-item', { sticky: comment['sticky'] }]"
  >
			<div 
				style="z-index: 1; top: -10px; position: absolute; opacity: 70%;"
				v-if="comment['sticky']"
			>
				<StickyIcon />
			</div>

			<div class="wl-user" aria-hidden="true">
				
				<img
					v-if="comment.avatar"
					class="wl-user-avatar"
					:src="comment.avatar"
					alt=""
				/>
				<VerifiedIcon v-if="comment.type" />
			</div>
	
			<div :class="['wl-card', { sticky: comment['sticky'] }]">
				<div class="wl-head">
					<a
						v-if="link"
						class="wl-nick"
						:href="link"
						target="_blank"
						rel="nofollow noopener noreferrer"
						>{{ comment.nick }}</a
					>
					<span v-else :class="['wl-nick', { sticky: comment['sticky'] }]">{{ comment.nick }}</span>
	
					<span
						v-if="comment.type === 'administrator'"
						:class="['wl-badge', 'admin']"
						v-text="locale.admin"
					/>
	
					<span v-if="comment.label" class="wl-badge" v-text="comment.label" />
	
					<span
						v-if="typeof comment.level === 'number'"
						:class="`wl-badge level${comment.level}`"
						v-text="locale[`level${comment.level}`] || `Level ${comment.level}`"
					/>
	
					<span class="wl-time" v-text="time" />
	
					
				</div>
	
				<div class="wl-meta" aria-hidden="true">
					<template v-for="item in ['addr', 'browser', 'os']">
						<span
							v-if="comment[item]"
							:key="item"
							:class="`wl-${item}`"
							:data-value="comment[item]"
							v-text="comment[item]"
						/>
					</template>
				</div>
	
				<div v-if="!isEditingCurrent" class="wl-content">
					<p v-if="comment.reply_user">
						<a :href="'#' + comment.pid">@{{ comment.reply_user.nick }}</a>
						<span>: </span>
					</p>
					<div class="wl-readmore" v-html="comment.comment" />
				</div>

				<div style="display: flex; justify-content: space-between; align-items: center;">
					<div v-if="!isEditingCurrent" class="wl-comment-actions">
						<template v-if="isAdmin || isOwner">
							<button
								type="button"
								class="wl-edit"
								@click="emit('edit', comment)"
							>
								<EditIcon />
							</button>
	
							<button
								type="button"
								class="wl-delete"
								@click="emit('delete', comment)"
							>
								<DeleteIcon />
							</button>
						</template>
	
						<button
							type="button"
							class="wl-like"
							:title="like ? locale.cancelLike : locale.like"
							@click="emit('like', comment)"
						>
							<span style="display: flex; flex-direction: row; gap: 0.25em;">
								<LikeIcon :active="like" />
									{{ 'like' in comment ? comment.like : '' }}
							</span>
						</button>
	
						<button
							type="button"
							class="wl-reply"
							:class="{ active: isReplyingCurrent }"
							:title="isReplyingCurrent ? locale.cancelReply : locale.reply"
							@click="onReply(comment)"
						>
							<span>Reply</span>
						</button>
					</div>
					
					<!-- <div style="display: flex; align-items: center; gap: 0.5em"> -->
						
						<div v-if="isAdmin && !isEditingCurrent" class="wl-admin-actions" style="display: flex; justify-content: space-between; align-items: center; gap: 0.5em;">
							<button
								v-if="isAdmin && !('rid' in comment)"
								type="submit"
								class="wl-btn wl-sticky"
								@click="emit('sticky', comment)"
							>
								{{ comment.sticky ? locale.unsticky : locale.sticky }}
							</button>
							<details class="dropdown">
									<summary role="button">
										<a class="button">
											<svg width="24" height="24" viewBox="0 0 24 24"  xmlns="http://www.w3.org/2000/svg">
												<path d="M7 12C7 13.1046 6.10457 14 5 14C3.89543 14 3 13.1046 3 12C3 10.8954 3.89543 10 5 10C6.10457 10 7 10.8954 7 12Z" fill="#999"/>
												<path d="M14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12Z" fill="#999"/>
												<path d="M21 12C21 13.1046 20.1046 14 19 14C17.8954 14 17 13.1046 17 12C17 10.8954 17.8954 10 19 10C20.1046 10 21 10.8954 21 12Z" fill="#999"/>
											</svg>
										</a>
									</summary>
									<ul>
										<li v-for="status in commentStatus" :key="status">
											<span
												:class="{ disabled: comment.status === status }"
												@click="emit('status', { status, comment })"
											>{{ locale[status] }}</span>
										</li>
										<li>
											<span
												@click="emit('banned', comment)"
											>Banned</span>
										</li>
								</ul>
							</details>
			
							
						</div>
					<!-- </div> -->
				</div>
	
	
				<div
					v-if="isReplyingCurrent || isEditingCurrent"
					:class="{
						'wl-reply-wrapper': isReplyingCurrent,
						'wl-edit-wrapper': isEditingCurrent,
					}"
				>
					<CommentBox
						:edit="edit"
						:reply-id="reply?.objectId"
						:reply-user="comment.nick"
						:root-id="rootId"
						@log="emit('log')"
						@cancel-reply="emit('reply', null)"
						@cancel-edit="emit('edit', null)"
						@submit="onSubmit($event)"
					/>
				</div>

				<div class="" v-if="'children' in comment && comment.children.length > 0">
					<button
						type="button"
						class="wl-show-comment"
						:title="showReplies ? 'Hide replies' : 'Show replies'"
						@click="showReplies = !showReplies"
					>
							<template v-if="!showReplies">
								<ChevronDownIcon />
							</template>
							<template v-else>
								<ChevronUpIcon />
							</template>
							{{ comment.children.length }} balasan
					</button>
				</div>
				
				<div v-if="'children' in comment" v-show="showReplies" class="wl-quote">
					<CommentCard
						v-for="child in comment.children"
						:key="child.objectId"
						:comment="child"
						:reply="reply"
						:edit="edit"
						:root-id="rootId"
						@log="emit('log')"
						@delete="emit('delete', $event)"
						@edit="onEdit($event!)"
						@like="emit('like', $event)"
						@reply="onReply($event!)"
						@status="emit('status', $event)"
						@sticky="emit('sticky', $event)"
						@submit="onSubmit($event)"
					/>
				</div>

				
			</div>
  </div>
</template>