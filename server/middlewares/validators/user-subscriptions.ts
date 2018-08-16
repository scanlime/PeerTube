import * as express from 'express'
import 'express-validator'
import { body, param } from 'express-validator/check'
import { logger } from '../../helpers/logger'
import { areValidationErrors } from './utils'
import { ActorFollowModel } from '../../models/activitypub/actor-follow'
import { isValidActorHandle } from '../../helpers/custom-validators/activitypub/actor'
import { UserModel } from '../../models/account/user'
import { CONFIG } from '../../initializers'

const userSubscriptionAddValidator = [
  body('uri').custom(isValidActorHandle).withMessage('Should have a valid URI to follow (username@domain)'),

  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.debug('Checking userSubscriptionAddValidator parameters', { parameters: req.body })

    if (areValidationErrors(req, res)) return

    return next()
  }
]

const userSubscriptionRemoveValidator = [
  param('uri').custom(isValidActorHandle).withMessage('Should have a valid URI to unfollow'),

  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.debug('Checking unfollow parameters', { parameters: req.params })

    if (areValidationErrors(req, res)) return

    let [ name, host ] = req.params.uri.split('@')
    if (host === CONFIG.WEBSERVER.HOST) host = null

    const user: UserModel = res.locals.oauth.token.User
    const subscription = await ActorFollowModel.loadByActorAndTargetNameAndHost(user.Account.Actor.id, name, host)

    if (!subscription) {
      return res
        .status(404)
        .json({
          error: `Subscription ${req.params.uri} not found.`
        })
        .end()
    }

    res.locals.subscription = subscription
    return next()
  }
]

// ---------------------------------------------------------------------------

export {
  userSubscriptionAddValidator,
  userSubscriptionRemoveValidator
}

// ---------------------------------------------------------------------------
