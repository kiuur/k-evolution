import { proto } from '../../WAProto'
import { GroupMetadata, GroupParticipant, ParticipantAction, SocketConfig, WAMessageKey, WAMessageStubType } from '../Types'
import { generateMessageID, unixTimestampSeconds } from '../Utils'
import { BinaryNode, getBinaryNodeChild, getBinaryNodeChildren, getBinaryNodeChildString, jidEncode, jidNormalizedUser } from '../WABinary'
import { makeGroupsSocket } from './groups'

export const makeNewsletterSocket = (config: SocketConfig) => {
	const sock = makeGroupsSocket(config)
	const { authState, ev, query, upsertMessage, generateMessageTag } = sock

	const newsletterQuery = async(jid: string, type: 'get' | 'set', xmlns: string, content: BinaryNode[]) => (
		query({
			tag: 'iq',
			attrs: {
                id: generateMessageTag(),
				type,
				xmlns,
				to: jid,
			},
			content
		})
	)
        
    const getNewsletterInfo = async (url: string) => {
        const parts = url.split("/");
        const code = parts[parts.length - 1]; 
		let payload = {
			variables: {
				input: {
					key: code,
					type: 'INVITE',
					view_role: 'GUEST',
				},
				fetch_viewer_metadata: false,
				fetch_full_image: true,
				fetch_creation_time: true,
			},
		};
	
		const data = await newsletterQuery(
            '@s.whatsapp.net',
            'get',
            'w:mex',
            [
                {
                    tag: 'query',
                    attrs: {
                        query_id: '6620195908089573',
                    },
                    content: Buffer.from(JSON.stringify(payload)),
                },
            ]
        );

		let result = JSON.parse(getBinaryNodeChildString(data, 'result') || '{}');
		return JSON.stringify(result, null, 2)
	}
    
    const createNewsletter = async (name: string, description: string | null) => {
        const payload = {
            variables: {
                newsletter_input: {
                   name,
                   description,
                   picture: null
                },
            },
    };
        const data = await newsletterQuery(
            '@s.whatsapp.net',
            'get',
            'w:mex',
            [
                {
                    tag: 'query',
                    attrs: {
                        query_id: '6234210096708695',
                    },
                    content: Buffer.from(JSON.stringify(payload)),
                },
            ]
        );
        const result = JSON.parse(getBinaryNodeChildString(data, 'result') || '{}');
        return JSON.stringify(result, null, 2);
    };

    const joinNewsletter = async (id: string) => {
        const payload = {
            variables: {
                newsletter_id: id,
            },
        };
        const data = await newsletterQuery(
            '@s.whatsapp.net',
            'get',
            'w:mex',
            [
                {
                    tag: 'query',
                    attrs: {
                        query_id: '9926858900719341',
                    },
                    content: Buffer.from(JSON.stringify(payload)),
                },
            ]
        );
        const result = JSON.parse(getBinaryNodeChildString(data, 'result') || '{}');
        return JSON.stringify(result, null, 2);
    };

    const leaveNewsletter = async (id: string) => {
        const payload = {
            variables: {
                newsletter_id: id,
            },
        };
        const data = await newsletterQuery(
            '@s.whatsapp.net',
            'get',
            'w:mex',
            [
                {
                    tag: 'query',
                    attrs: {
                        query_id: '6392786840836363',
                    },
                    content: Buffer.from(JSON.stringify(payload)),
                },
            ]
        );
        const result = JSON.parse(getBinaryNodeChildString(data, 'result') || '{}');
        return JSON.stringify(result, null, 2);
    };
    
    const sendNewsletterReaction = async (jid: string, serverID: string, reaction: string | null) => {
        const payload: BinaryNode = {
            tag: 'message',
            attrs: {
                to: jid,
                id: generateMessageTag(),
                server_id: serverID,
                type: 'reaction',
            },
            content: [
                {
                    tag: 'reaction',
                    attrs: reaction ? { code: reaction } : {},
                },
            ],
        };
    
        const result = await query(payload);
        return result;
    };

    return {
		...sock,
		getNewsletterInfo,
		createNewsletter,
		joinNewsletter,
		leaveNewsletter,
		sendNewsletterReaction
    }
}
