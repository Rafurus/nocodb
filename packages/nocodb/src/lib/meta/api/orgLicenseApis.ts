import { Router } from 'express';
import { OrgUserRoles } from '../../../enums/OrgUserRoles';
import { LICENSE_KEY } from '../../constants'
import Store from '../../models/Store';
import { metaApiMetrics } from '../helpers/apiMetrics';
import ncMetaAclMw from '../helpers/ncMetaAclMw';



async function licenseGet(_req, res) {
  const license = await Store.get(LICENSE_KEY);

  res.json({ key: license?.value });
}

async function licenseSet(req, res) {
  await Store.saveOrUpdate({ value: req.body.key, key: LICENSE_KEY });

  res.json({ msg: 'License key saved' });
}

const router = Router({ mergeParams: true });
router.get(
  '/api/v1/license',
  metaApiMetrics,
  ncMetaAclMw(licenseGet, 'licenseGet', {
    allowedRoles: [OrgUserRoles.SUPER],
    blockApiTokenAccess: true,
  })
);
router.post(
  '/api/v1/license',
  metaApiMetrics,
  ncMetaAclMw(licenseSet, 'licenseSet', {
    allowedRoles: [OrgUserRoles.SUPER],
    blockApiTokenAccess: true,
  })
);

export default router;