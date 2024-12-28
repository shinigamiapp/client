<script setup lang="ts">
import { useNow } from '@vueuse/core';
import type { WalineComment, WalineCommentStatus } from '@waline/api';
import type { ComputedRef } from 'vue';
import { computed, inject } from 'vue';

import CommentBox from './CommentBox.vue';
import {
  DeleteIcon,
  EditIcon,
  LikeIcon,
  ReplyIcon,
  VerifiedIcon,
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
</script>

<template>
  <div
    :id="comment.objectId"
    :class="['wl-card-item', { sticky: comment['sticky'] }]"
  >
			<div 
				style="z-index: 1; top: -5px; position: absolute; opacity: 70%;"
				v-if="comment['sticky']"
			>
				<svg fill="#BBBBBB" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
					width="20px" height="20px" viewBox="0 0 523.829 523.83"
					xml:space="preserve">
				<g>
					<path d="M519.572,109.974L413.849,4.327c-5.737-5.737-15.07-5.737-20.808,0l-12.164,12.164c-5.737,5.738-5.737,15.071,0,20.808
						l4.896,4.896L265.209,162.835c-29.069-15.912-66.172-11.628-90.729,12.928l-43.452,43.452c-5.737,5.737-5.737,15.07,0,20.808
						l53.321,53.32L3.962,492.704c-5.432,6.043-5.278,15.605,0.459,21.344l5.278,5.278c5.738,5.737,15.3,6.043,21.344,0.459
						l199.206-180.158l52.861,52.862c5.737,5.737,15.07,5.737,20.808,0l43.452-43.452c24.48-24.48,28.917-61.2,13.312-90.271
						l120.641-120.64l4.896,4.896c5.737,5.737,15.07,5.737,20.809,0l12.163-12.164C525.31,125.121,525.31,115.788,519.572,109.974z"/>
				</g>
				</svg>
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
					<div v-html="comment.comment" />
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
							<LikeIcon :active="like" />
							{{ 'like' in comment ? comment.like : '' }}
						</button>
	
						<button
							type="button"
							class="wl-reply"
							:class="{ active: isReplyingCurrent }"
							:title="isReplyingCurrent ? locale.cancelReply : locale.reply"
							@click="emit('reply', isReplyingCurrent ? null : comment)"
						>
							<ReplyIcon />
						</button>
					</div>
					<div v-if="isAdmin && !isEditingCurrent" class="wl-admin-actions">
						
						
							
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
							</ul>
						</details>
						<!-- <button
							v-for="status in commentStatus"
							:key="status"
							type="submit"
							:class="`wl-btn wl-${status}`"
							:disabled="comment.status === status"
							@click="emit('status', { status, comment })"
							v-text="locale[status]"
						/> -->
		
						<button
							v-if="isAdmin && !('rid' in comment)"
							type="submit"
							class="wl-btn wl-sticky"
							@click="emit('sticky', comment)"
						>
							{{ comment.sticky ? locale.unsticky : locale.sticky }}
						</button>
					</div>
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
						@submit="emit('submit', $event)"
					/>
				</div>
	
				<div v-if="'children' in comment" class="wl-quote">
					<CommentCard
						v-for="child in comment.children"
						:key="child.objectId"
						:comment="child"
						:reply="reply"
						:edit="edit"
						:root-id="rootId"
						@log="emit('log')"
						@delete="emit('delete', $event)"
						@edit="emit('edit', $event)"
						@like="emit('like', $event)"
						@reply="emit('reply', $event)"
						@status="emit('status', $event)"
						@sticky="emit('sticky', $event)"
						@submit="emit('submit', $event)"
					/>
				</div>
			</div>
  </div>
</template>
